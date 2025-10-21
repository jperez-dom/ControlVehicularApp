<?php

namespace App\Monolog;

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

        $logEntry->setUserId($record['extra']['user_id'] ?? 0);
        $logEntry->setAction($context['action'] ?? 'UNKNOWN');
        $logEntry->setTableName($context['table'] ?? 'N/A');
        $logEntry->setRecordId($recordId ?? 'N/A');
        $logEntry->setDescription($record->message);
        $logEntry->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($logEntry);
        $this->em->flush();
    }
}
