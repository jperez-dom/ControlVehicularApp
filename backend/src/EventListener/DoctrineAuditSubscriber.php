<?php

namespace App\EventListener;

use App\Entity\Comission;
use App\Entity\Driver;
use App\Entity\Inspection;
use App\Entity\LogAction;
use App\Entity\Pass;
use App\Entity\Place;
use App\Entity\Users;
use App\Entity\Vehicle;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

class DoctrineAuditSubscriber
{
    private EntityManagerInterface $entityManager;
    private RequestStack $requestStack;
    private TokenStorageInterface $tokenStorage;

    public function __construct(EntityManagerInterface $entityManager, RequestStack $requestStack, TokenStorageInterface $tokenStorage)
    {
        $this->entityManager = $entityManager;
        $this->requestStack = $requestStack;
        $this->tokenStorage = $tokenStorage;
    }

    public function postPersist(LifecycleEventArgs $args): void
    {
        $this->logChange('INSERT', $args);
    }

    public function postUpdate(LifecycleEventArgs $args): void
    {
        $this->logChange('UPDATE', $args);
    }

    public function postRemove(LifecycleEventArgs $args): void
    {
        $this->logChange('DELETE', $args);
    }

    private function logChange(string $action, LifecycleEventArgs $args): void
    {
        $entity = $args->getObject();

        if ($entity instanceof LogAction || $entity instanceof Users) {
            return;
        }

        $user = null;
        $userName = 'Sistema'; // Default a "Sistema" si no se encuentra un usuario

        $token = $this->tokenStorage->getToken();
        if ($token && $token->getUser() instanceof Users) {
            $user = $token->getUser();
            $userName = $user->getUser();
        } else {
            $request = $this->requestStack->getCurrentRequest();
            if ($request) {
                $headerUserId = $request->headers->get('X-USER-ID');
                if ($headerUserId) {
                    $user = $this->entityManager->getRepository(Users::class)->find($headerUserId);
                    if ($user) {
                        $userName = $user->getUser();
                    }
                }
            }
        }

        if (!$user) {
            // Si no se puede determinar el usuario, no se registra el log.
            // Opcional: podrías decidir registrarlo como una acción del sistema.
            return;
        }

        $description = $this->generateDescription($action, $entity, $userName);

        $logAction = new LogAction();
        $logAction->setAction($action);
        $logAction->setTableName($this->entityManager->getClassMetadata(get_class($entity))->getTableName());
        $logAction->setDescription($description);
        $logAction->setUser($user);

        $this->entityManager->persist($logAction);
        $this->entityManager->flush();
    }

    private function generateDescription(string $action, object $entity, string $userName): string
    {
        $entityClass = get_class($entity);
        $entityName = basename(str_replace('\\', '/', $entityClass));
        $entityId = method_exists($entity, 'getId') ? $entity->getId() : 'N/A';

        $verb = match ($action) {
            'INSERT' => 'creó',
            'UPDATE' => 'actualizó',
            'DELETE' => 'eliminó',
            default => 'realizó una acción en',
        };

        $details = 'un registro';

        switch ($entityClass) {
            case Comission::class:
                /** @var Comission $entity */
                $details = sprintf("la comisión con folio %s", $entity->getFolio());
                break;
            case Driver::class:
                /** @var Driver $entity */
                $details = sprintf("al conductor '%s'", $entity->getName());
                break;
            case Vehicle::class:
                /** @var Vehicle $entity */
                $details = sprintf("el vehículo %s %s", $entity->getBrand(), $entity->getModel());
                break;
            case Pass::class:
                /** @var Pass $entity */
                $details = sprintf("el pase de salida/entrada para la comisión %s", $entity->getComission()?->getFolio() ?? 'N/A');
                break;
            case Inspection::class:
                /** @var Inspection $entity */
                $details = sprintf("una inspección de tipo '%s' para el pase de la comisión %s", $entity->getType(), $entity->getPass()?->getComission()?->getFolio() ?? 'N/A');
                break;
            case Place::class:
                /** @var Place $entity */
                $details = sprintf("el destino '%s, %s' para la comisión %s", $entity->getCity(), $entity->getState(), $entity->getComission()?->getFolio() ?? 'N/A');
                break;
            default:
                $details = sprintf("un registro de tipo %s (ID: %s)", $entityName, $entityId);
                break;
        }

        return sprintf("El usuario '%s' %s %s.", $userName, $verb, $details);
    }
}
