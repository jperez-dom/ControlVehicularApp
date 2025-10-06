<?php

namespace App\Entity;

use App\Repository\DriverRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: DriverRepository::class)]
#[ORM\Table(name: "driver")]
class Driver
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer", unsigned: true)]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private ?string $name = null;

    #[ORM\Column(length: 50)]
    private ?string $position = null;

    #[ORM\Column(length: 50)]
    private ?string $phone = null;

    #[ORM\Column(length: 50)]
    private ?string $email = null;

    #[ORM\Column(length: 1)]
    private ?string $status = '1';

    #[ORM\Column(type: "datetime")]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: "datetime", nullable: true)]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\OneToMany(mappedBy: "driver", targetEntity: Comission::class)]
    private Collection $comissions;

    public function __construct()
    {
        $this->comissions = new ArrayCollection();
    }

    // Getters y setters ↓↓↓

    public function getId(): ?int { return $this->id; }
    public function getName(): ?string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }

    public function getPosition(): ?string { return $this->position; }
    public function setPosition(string $position): static { $this->position = $position; return $this; }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(string $phone): static { $this->phone = $phone; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getCreatedAt(): ?\DateTimeInterface { return $this->created_at; }
    public function setCreatedAt(\DateTimeInterface $created_at): static { $this->created_at = $created_at; return $this; }

    public function getUpdatedAt(): ?\DateTimeInterface { return $this->updated_at; }
    public function setUpdatedAt(?\DateTimeInterface $updated_at): static { $this->updated_at = $updated_at; return $this; }

    /** @return Collection<int, Comission> */
    public function getComissions(): Collection { return $this->comissions; }
    public function addComission(Comission $comission): static {
        if (!$this->comissions->contains($comission)) {
            $this->comissions->add($comission);
            $comission->setDriver($this);
        }
        return $this;
    }
    public function removeComission(Comission $comission): static {
        if ($this->comissions->removeElement($comission) && $comission->getDriver() === $this) {
            $comission->setDriver(null);
        }
        return $this;
    }
}
