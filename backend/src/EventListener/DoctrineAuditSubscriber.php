<?php

namespace App\EventListener;

use App\Entity\LogAction;
use App\Entity\Users;
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
        $userName = 'Desconocido';
        $userId = null;

        $token = $this->tokenStorage->getToken();
        if ($token && $token->getUser() instanceof Users) {
            $user = $token->getUser();
            $userName = $user->getUser();
            $userId = $user->getId();
        } else {
            $request = $this->requestStack->getCurrentRequest();
            if ($request) {
                $headerUserId = $request->headers->get('X-USER-ID');
                if ($headerUserId) {
                    $user = $this->entityManager->getRepository(Users::class)->find($headerUserId);
                    if ($user) {
                        $userName = $user->getUser();
                        $userId = $user->getId();
                    }
                }
            }
        }

        if (!$user) {
            return;
        }

        $logAction = new LogAction();
        $logAction->setAction($action);
        $logAction->setTableName($this->entityManager->getClassMetadata(get_class($entity))->getTableName());

        $description = sprintf(
            '%s %s una entidad de tipo %s (ID: %s).',
            $userName,
            ($action === 'INSERT' ? 'creó' : ($action === 'UPDATE' ? 'actualizó' : 'eliminó')),
            basename(str_replace('\\', '/', get_class($entity))),
            method_exists($entity, 'getId') ? $entity->getId() : 'N/A'
        );
        $logAction->setDescription($description);
        $logAction->setUser($user);

        $this->entityManager->persist($logAction);
        $this->entityManager->flush();
    }
}
