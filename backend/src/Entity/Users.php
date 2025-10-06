<?php

namespace App\Entity;

use App\Repository\UsersRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UsersRepository::class)]
#[ORM\Table(name: "users")]
class Users
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer", unsigned: true)]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    private ?string $user = null;

    #[ORM\Column(length: 50)]
    private ?string $password = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $email = null;

    #[ORM\Column(type: "string", length: 1, options: ["default" => "1"])]
    private ?string $status = '1';

    #[ORM\Column(name: "created_at", type: "datetime", options: ["default" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: "updated_at", type: "datetime", nullable: true, options: ["default" => "CURRENT_TIMESTAMP", "on update" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\OneToMany(mappedBy: "user", targetEntity: Comission::class)]
    private Collection $comissions;

    public function __construct()
    {
        $this->comissions = new ArrayCollection();
    }

    // 🔹 ID
    public function getId(): ?int
    {
        return $this->id;
    }

    // 🔹 User
    public function getUser(): ?string
    {
        return $this->user;
    }

    public function setUser(string $user): static
    {
        $this->user = $user;
        return $this;
    }

    // 🔹 Password
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    // 🔹 Email
    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = $email;
        return $this;
    }

    // 🔹 Status
    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    // 🔹 CreatedAt
    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    // 🔹 UpdatedAt
    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    /**
     * @return Collection<int, Comission>
     */
    public function getComissions(): Collection
    {
        return $this->comissions;
    }

    public function addComission(Comission $comission): static
    {
        if (!$this->comissions->contains($comission)) {
            $this->comissions->add($comission);
            $comission->setUser($this);
        }

        return $this;
    }

    public function removeComission(Comission $comission): static
    {
        if ($this->comissions->removeElement($comission)) {
            if ($comission->getUser() === $this) {
                $comission->setUser(null);
            }
        }

        return $this;
    }
}
