<?php

namespace App\Entity;

use App\Repository\VehicleRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: VehicleRepository::class)]
#[ORM\Table(name: "vehicle")]
#[ORM\HasLifecycleCallbacks]
class Vehicle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER, options: ["unsigned" => true])]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    private ?string $plate = null;

    #[ORM\Column(length: 50)]
    private ?string $brand = null;

    #[ORM\Column(length: 50)]
    private ?string $model = null;

    #[ORM\Column(type: Types::INTEGER)]
    private ?int $year = null;

    #[ORM\Column(length: 50)]
    private ?string $color = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $internal_number = null;

    #[ORM\Column(type: Types::STRING, length: 1, options: ["default" => "1"])]
    private ?string $status = '1';

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true, options: [
        "default" => "CURRENT_TIMESTAMP"
    ])]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true, options: [
        "default" => "CURRENT_TIMESTAMP",
        "on update" => "CURRENT_TIMESTAMP"
    ])]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\OneToMany(mappedBy: "vehicle", targetEntity: Comission::class)]
    private Collection $comissions;

    public function __construct()
    {
        $this->comissions = new ArrayCollection();
        $this->status = '1';
        $this->created_at = new \DateTimeImmutable();
        $this->updated_at = new \DateTimeImmutable();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if ($this->created_at === null) {
            $this->created_at = new \DateTimeImmutable();
        }
        $this->updated_at = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updated_at = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getPlate(): ?string { return $this->plate; }
    public function setPlate(string $plate): static { $this->plate = $plate; return $this; }

    public function getBrand(): ?string { return $this->brand; }
    public function setBrand(string $brand): static { $this->brand = $brand; return $this; }

    public function getModel(): ?string { return $this->model; }
    public function setModel(string $model): static { $this->model = $model; return $this; }

    public function getYear(): ?int { return $this->year; }
    public function setYear(int $year): static { $this->year = $year; return $this; }

    public function getColor(): ?string { return $this->color; }
    public function setColor(string $color): static { $this->color = $color; return $this; }

    public function getInternalNumber(): ?int { return $this->internal_number; }
    public function setInternalNumber(?int $internal_number): static { $this->internal_number = $internal_number; return $this; }

    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getCreatedAt(): ?\DateTimeInterface { return $this->created_at; }
    public function setCreatedAt(?\DateTimeInterface $created_at): static { $this->created_at = $created_at; return $this; }

    public function getUpdatedAt(): ?\DateTimeInterface { return $this->updated_at; }
    public function setUpdatedAt(?\DateTimeInterface $updated_at): static { $this->updated_at = $updated_at; return $this; }

    /** @return Collection<int, Comission> */
    public function getComissions(): Collection { return $this->comissions; }

    public function addComission(Comission $comission): static
    {
        if (!$this->comissions->contains($comission)) {
            $this->comissions->add($comission);
            $comission->setVehicle($this);
        }
        return $this;
    }

    public function removeComission(Comission $comission): static
    {
        if ($this->comissions->removeElement($comission) && $comission->getVehicle() === $this) {
            $comission->setVehicle(null);
        }
        return $this;
    }
}
