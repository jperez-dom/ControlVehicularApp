<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251022220037 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE comission (id INT AUTO_INCREMENT NOT NULL, vehicle_id INT UNSIGNED NOT NULL, driver_id INT NOT NULL, user_id INT NOT NULL, folio INT NOT NULL, city VARCHAR(50) NOT NULL, state VARCHAR(50) NOT NULL, date DATE NOT NULL, description VARCHAR(50) DEFAULT NULL, status VARCHAR(1) DEFAULT \'1\' NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX IDX_8727369A545317D1 (vehicle_id), INDEX IDX_8727369AC3423909 (driver_id), INDEX IDX_8727369AA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE driver (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(100) NOT NULL, position VARCHAR(50) NOT NULL, phone VARCHAR(50) NOT NULL, email VARCHAR(50) NOT NULL, status VARCHAR(1) DEFAULT \'1\' NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE inspection (id INT AUTO_INCREMENT NOT NULL, pass_id INT NOT NULL, type VARCHAR(50) NOT NULL, part VARCHAR(50) NOT NULL, comment LONGTEXT DEFAULT NULL, photo_url LONGTEXT DEFAULT NULL, signature_conductor LONGTEXT DEFAULT NULL, signature_approver LONGTEXT DEFAULT NULL, status VARCHAR(1) DEFAULT \'1\' NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX IDX_F9F13485EC545AE5 (pass_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE log_action (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, action VARCHAR(255) NOT NULL, table_name VARCHAR(255) NOT NULL, record_id VARCHAR(255) DEFAULT NULL, description LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE pass (id INT AUTO_INCREMENT NOT NULL, comission_id INT NOT NULL, mileage INT NOT NULL, fuel VARCHAR(50) NOT NULL, departure_comment LONGTEXT DEFAULT NULL, arrival_comment LONGTEXT DEFAULT NULL, start_date DATETIME NOT NULL, end_date DATETIME NOT NULL, status VARCHAR(1) DEFAULT \'1\' NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX IDX_CE70D424BAD3DC8F (comission_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE place (id INT AUTO_INCREMENT NOT NULL, comission_id INT NOT NULL, state VARCHAR(150) NOT NULL, city VARCHAR(150) NOT NULL, status VARCHAR(1) DEFAULT \'1\' NOT NULL, comment LONGTEXT DEFAULT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX IDX_741D53CDBAD3DC8F (comission_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE users (id INT AUTO_INCREMENT NOT NULL, user VARCHAR(50) NOT NULL, password VARCHAR(50) NOT NULL, email VARCHAR(50) DEFAULT NULL, status VARCHAR(1) DEFAULT \'1\' NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, codigo VARCHAR(10) DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE vehicle (id INT UNSIGNED AUTO_INCREMENT NOT NULL, plate VARCHAR(50) NOT NULL, brand VARCHAR(50) NOT NULL, model VARCHAR(50) NOT NULL, year INT NOT NULL, color VARCHAR(50) NOT NULL, internal_number INT DEFAULT NULL, status VARCHAR(1) DEFAULT \'1\' NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE comission ADD CONSTRAINT FK_8727369A545317D1 FOREIGN KEY (vehicle_id) REFERENCES vehicle (id)');
        $this->addSql('ALTER TABLE comission ADD CONSTRAINT FK_8727369AC3423909 FOREIGN KEY (driver_id) REFERENCES driver (id)');
        $this->addSql('ALTER TABLE comission ADD CONSTRAINT FK_8727369AA76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE inspection ADD CONSTRAINT FK_F9F13485EC545AE5 FOREIGN KEY (pass_id) REFERENCES pass (id)');
        $this->addSql('ALTER TABLE pass ADD CONSTRAINT FK_CE70D424BAD3DC8F FOREIGN KEY (comission_id) REFERENCES comission (id)');
        $this->addSql('ALTER TABLE place ADD CONSTRAINT FK_741D53CDBAD3DC8F FOREIGN KEY (comission_id) REFERENCES comission (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE comission DROP FOREIGN KEY FK_8727369A545317D1');
        $this->addSql('ALTER TABLE comission DROP FOREIGN KEY FK_8727369AC3423909');
        $this->addSql('ALTER TABLE comission DROP FOREIGN KEY FK_8727369AA76ED395');
        $this->addSql('ALTER TABLE inspection DROP FOREIGN KEY FK_F9F13485EC545AE5');
        $this->addSql('ALTER TABLE pass DROP FOREIGN KEY FK_CE70D424BAD3DC8F');
        $this->addSql('ALTER TABLE place DROP FOREIGN KEY FK_741D53CDBAD3DC8F');
        $this->addSql('DROP TABLE comission');
        $this->addSql('DROP TABLE driver');
        $this->addSql('DROP TABLE inspection');
        $this->addSql('DROP TABLE log_action');
        $this->addSql('DROP TABLE pass');
        $this->addSql('DROP TABLE place');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE vehicle');
    }
}
