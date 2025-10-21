<?php

namespace App\EventListener;

use App\Entity\AuditLog;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Monolog\Logger;
use Symfony\Component\HttpFoundation\RequestStack;

class DoctrineAuditSubscriber implements EventSubscriber
{
    private Logger $logger;
    private RequestStack $requestStack;

    public function __construct(Logger $logger, RequestStack $requestStack)
    {
        $this->logger = $logger;
        $this->requestStack = $requestStack;
    }

    public function getSubscribedEvents(): array
    {
        return [
            Events::prePersist,
            Events::preUpdate,
            Events::preRemove,
        ];
    }

    public function prePersist(LifecycleEventArgs $args): void
    {
        $this->logChange('INSERT', $args);
    }

    public function preUpdate(LifecycleEventArgs $args): void
    {
        $this->logChange('UPDATE', $args);
    }

    public function preRemove(LifecycleEventArgs $args): void
    {
        $this->logChange('DELETE', $args);
    }

    private function logChange(string $action, LifecycleEventArgs $args)
    {
        $entity = $args->getObject();
        if ($entity instanceof AuditLog) {
            return;
        }

        $request = $this->requestStack->getCurrentRequest();
        $userId = $request ? $request->headers->get('X-USER-ID', 'system') : 'system';

        $this->logger->info('DB Change', [
            'user_id' => $userId,
            'action' => $action,
            'entity' => get_class($entity),
            'data' => method_exists($entity, 'getId') ? $entity->getId() : null,
        ]);
    }
}
