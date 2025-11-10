<?php

namespace App\Monolog;

use App\Entity\Users;
use Doctrine\ORM\EntityManagerInterface;
use Monolog\Handler\AbstractProcessingHandler;
use Monolog\LogRecord;
use App\Entity\LogAction;

class DatabaseHandler extends AbstractProcessingHandler
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em, $level = 100, bool $bubble = true)
    {
        parent::__construct($level, $bubble);
        $this->em = $em;
    }

    protected function write(LogRecord $record): void
    {
        $logEntry = new LogAction();
        $context = $record->context;

        // 1. Obtener el ID de usuario del contexto del log
        $userId = $record['extra']['user_id'] ?? null;

        if ($userId) {
            // 2. Buscar la entidad Users completa
            $user = $this->em->getRepository(Users::class)->find($userId);
            if ($user) {
                // 3. Asignar el objeto Users al log
                $logEntry->setUser($user);
            } else {
                // Opcional: si no se encuentra el usuario, no se guarda el log o se guarda con un usuario por defecto
                return; // No guardar el log si el usuario no es válido
            }
        } else {
            return; // No guardar el log si no hay ID de usuario
        }

        $logEntry->setAction($context['action'] ?? 'UNKNOWN');
        $logEntry->setTableName($context['table'] ?? 'N/A');
        $logEntry->setDescription($record->message);
        $logEntry->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($logEntry);
        $this->em->flush();
    }
}
