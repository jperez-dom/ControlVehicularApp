<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251023014623 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE log_action DROP record_id, CHANGE user_id user_id INT NOT NULL');
        $this->addSql('ALTER TABLE log_action ADD CONSTRAINT FK_5236DF30A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('CREATE INDEX IDX_5236DF30A76ED395 ON log_action (user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE log_action DROP FOREIGN KEY FK_5236DF30A76ED395');
        $this->addSql('DROP INDEX IDX_5236DF30A76ED395 ON log_action');
        $this->addSql('ALTER TABLE log_action ADD record_id VARCHAR(255) DEFAULT NULL, CHANGE user_id user_id INT DEFAULT NULL');
    }
}
