<?php

namespace App\Entity;


use App\Entity\Users;
use App\Repository\LogActionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: LogActionRepository::class)]
#[ORM\HasLifecycleCallbacks] // Añadido para gestionar el nombre de usuario automáticamente
class LogAction
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // 1. RELACIÓN DE OBJETO: Apunta a la entidad completa Users
    #[ORM\ManyToOne(targetEntity: Users::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Users $user = null;

    // 2. CAMPO STRING: Almacena el nombre de usuario (la "fila" que pediste)
    #[ORM\Column(length: 50)]
    private ?string $userName = null; // Nuevo campo para guardar el nombre de usuario como string

    #[ORM\Column(length: 255)]
    private ?string $action = null;

    #[ORM\Column(length: 255)]
    private ?string $tableName = null;

    // --- El campo recordId fue ELIMINADO ---

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    // --- Función para rellenar automáticamente el userName al guardar ---
    #[ORM\PrePersist]
    public function setUserNameOnPrePersist(): void
    {
        if ($this->user && !$this->userName) {
            // Asume que el método en la entidad Users para obtener el nombre de usuario es getUser()
            $this->userName = $this->user->getUser();
        }
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTimeImmutable();
        }
    }

    // --- Getters y Setters ---

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?Users
    {
        return $this->user;
    }

    public function setUser(?Users $user): self
    {
        $this->user = $user;
        // Opcional: Si estableces el usuario, también puedes establecer el nombre de usuario aquí
        if ($user) {
            $this->userName = $user->getUser();
        }
        return $this;
    }

    public function getUserName(): ?string // Nuevo getter para el string de usuario
    {
        return $this->userName;
    }

    public function setUserName(string $userName): static // Nuevo setter para el string de usuario
    {
        $this->userName = $userName;
        return $this;
    }

    public function getAction(): ?string
    {
        return $this->action;
    }

    public function setAction(string $action): static
    {
        $this->action = $action;

        return $this;
    }

    public function getTableName(): ?string
    {
        return $this->tableName;
    }

    public function setTableName(string $tableName): static
    {
        $this->tableName = $tableName;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }
}
