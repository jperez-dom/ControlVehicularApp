<?php

namespace App\EventListener;

use App\Entity\LogAction;
use App\Entity\Users;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Event\PostRemoveEventArgs;
use Doctrine\ORM\Events;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

/**
 * Este listener audita automáticamente las acciones de Crear, Actualizar y Borrar (CRUD)
 * en la base de datos y las guarda en la tabla 'log_action'.
 *
 * Utiliza atributos de PHP 8 para registrarse, lo que simplifica el archivo services.yaml.
 */
#[AsDoctrineListener(event: Events::postPersist, priority: 500, connection: 'default')]
#[AsDoctrineListener(event: Events::postUpdate, priority: 500, connection: 'default')]
#[AsDoctrineListener(event: Events::postRemove, priority: 500, connection: 'default')]
final class DoctrineAuditSubscriber
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly RequestStack $requestStack,
        private readonly TokenStorageInterface $tokenStorage
    ) {
    }

    public function postPersist(PostPersistEventArgs $args): void
    {
        $this->logActivity('INSERT', $args->getObject());
    }

    public function postUpdate(PostUpdateEventArgs $args): void
    {
        $this->logActivity('UPDATE', $args->getObject());
    }

    public function postRemove(PostRemoveEventArgs $args): void
    {
        $this->logActivity('DELETE', $args->getObject());
    }

    private function logActivity(string $action, object $entity): void
    {
        // 1. Ignorar la propia entidad de log para evitar bucles infinitos.
        if ($entity instanceof LogAction) {
            return;
        }

        // 2. Obtener el usuario de forma segura.
        $token = $this->tokenStorage->getToken();
        if (null === $token) {
            return;
        }

        $user = $token->getUser();
        if (!$user instanceof Users) {
            return;
        }

        // 3. Construir la descripción del log.
        $tableName = $this->em->getClassMetadata(get_class($entity))->getTableName();
        $description = "El usuario '{$user->getUser()}' realizó una acción de '{$action}' en la tabla '{$tableName}'.";
        if (method_exists($entity, 'getId')) {
            $description .= " (ID: {$entity->getId()})";
        }

        // 4. Crear y persistir la entidad de log.
        try {
            $log = new LogAction();
            $log->setUser($user);
            $log->setUserName($user->getUser()); // Asumiendo que tienes un método getUser() o getName()
            $log->setAction($action);
            $log->setTableName($tableName);
            $log->setDescription($description);
            $log->setCreatedAt(new \DateTimeImmutable());

            // Usamos un nuevo EntityManager para esta operación para evitar interferencias
            // con la transacción principal, lo que previene errores de "nested flush".
            $newEm = $this->em->create(
                $this->em->getConnection(),
                $this->em->getConfiguration()
            );

            $newEm->persist($log);
            $newEm->flush();

        } catch (\Exception $e) {
            // Si la auditoría falla, no debe detener la aplicación principal.
            // Aquí podrías registrar el error de auditoría en un archivo de log si lo necesitas.
        }
    }
}
