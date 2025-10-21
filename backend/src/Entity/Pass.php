<?php

namespace App\Entity;

use App\Repository\PassRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;

#[ORM\Entity(repositoryClass: PassRepository::class)]
#[ORM\Table(name: "pass")]
#[ORM\HasLifecycleCallbacks]
class Pass
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(type: Types::INTEGER)]
    private ?int $mileage = null;

    #[ORM\Column(length: 50)]
    private ?string $fuel = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $departureComment = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $arrivalComment = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $start_date = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $end_date = null;

    #[ORM\Column(type: Types::STRING, length: 1, options: ["default" => "1"])]
    private ?string $status = '1';

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true, options: ["default" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true, options: ["default" => "CURRENT_TIMESTAMP", "on update" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\ManyToOne(targetEntity: Comission::class, inversedBy: "passes")]
    #[ORM\JoinColumn(nullable: false)]
    private ?Comission $comission = null;

    #[ORM\OneToMany(mappedBy: "pass", targetEntity: Inspection::class)]
    private Collection $inspections;

    public function __construct()
    {
        $this->inspections = new ArrayCollection();
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
    public function getMileage(): ?int { return $this->mileage; }
    public function setMileage(int $mileage): static { $this->mileage = $mileage; return $this; }
    public function getFuel(): ?string { return $this->fuel; }
    public function setFuel(string $fuel): static { $this->fuel = $fuel; return $this; }
    public function getDepartureComment(): ?string { return $this->departureComment; }
    public function setDepartureComment(?string $departureComment): static { $this->departureComment = $departureComment; return $this; }
    public function getArrivalComment(): ?string { return $this->arrivalComment; }
    public function setArrivalComment(?string $arrivalComment): static { $this->arrivalComment = $arrivalComment; return $this; }
    public function getStartDate(): ?\DateTimeInterface { return $this->start_date; }
    public function setStartDate(\DateTimeInterface $start_date): static { $this->start_date = $start_date; return $this; }
    public function getEndDate(): ?\DateTimeInterface { return $this->end_date; }
    public function setEndDate(\DateTimeInterface $end_date): static { $this->end_date = $end_date; return $this; }
    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getCreatedAt(): ?\DateTimeInterface { return $this->created_at; }
    public function setCreatedAt(?\DateTimeInterface $created_at): static { $this->created_at = $created_at; return $this; }
    public function getUpdatedAt(): ?\DateTimeInterface { return $this->updated_at; }
    public function setUpdatedAt(?\DateTimeInterface $updated_at): static { $this->updated_at = $updated_at; return $this; }
    public function getComission(): ?Comission { return $this->comission; }
    public function setComission(?Comission $comission): static { $this->comission = $comission; return $this; }
    public function getInspections(): Collection { return $this->inspections; }

    public function addInspection(Inspection $inspection): static
    {
        if (!$this->inspections->contains($inspection)) {
            $this->inspections->add($inspection);
            $inspection->setPass($this);
        }
        return $this;
    }

    public function removeInspection(Inspection $inspection): static
    {
        if ($this->inspections->removeElement($inspection) && $inspection->getPass() === $this) {
            $inspection->setPass(null);
        }
        return $this;
    }
}
