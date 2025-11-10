<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251110050423 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE inspection ADD CONSTRAINT FK_F9F13485F6731D54 FOREIGN KEY (departure_pass_id) REFERENCES departure_pass (id)');
        $this->addSql('CREATE INDEX IDX_F9F13485F6731D54 ON inspection (departure_pass_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE inspection DROP FOREIGN KEY FK_F9F13485F6731D54');
        $this->addSql('DROP INDEX IDX_F9F13485F6731D54 ON inspection');
    }
}
