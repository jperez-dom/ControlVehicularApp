<?php

namespace App\Entity;

use App\Repository\PassRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: PassRepository::class)]
#[ORM\Table(name: "pass")]
class Pass
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer", unsigned: true)]
    private ?int $id = null;

    #[ORM\Column(type: "integer")]
    private ?int $mileage = null;

    #[ORM\Column(length: 50)]
    private ?string $fuel = null;

    #[ORM\Column(type: "text", nullable: true)]
    private ?string $observations = null;

    #[ORM\Column(length: 50)]
    private ?string $mileage_photo = null;

    #[ORM\Column(type: "datetime")]
    private ?\DateTimeInterface $start_date = null;

    #[ORM\Column(type: "datetime")]
    private ?\DateTimeInterface $end_date = null;

    #[ORM\Column(length: 1)]
    private ?string $status = '1';

    #[ORM\Column(type: "datetime")]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: "datetime", nullable: true)]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\ManyToOne(targetEntity: Comission::class, inversedBy: "passes")]
    #[ORM\JoinColumn(nullable: false)]
    private ?Comission $comission = null;

    #[ORM\OneToMany(mappedBy: "pass", targetEntity: Inspection::class)]
    private Collection $inspections;

    public function __construct()
    {
        $this->inspections = new ArrayCollection();
    }

    // Getters / Setters
    public function getId(): ?int { return $this->id; }
    public function getMileage(): ?int { return $this->mileage; }
    public function setMileage(int $mileage): static { $this->mileage = $mileage; return $this; }
    public function getFuel(): ?string { return $this->fuel; }
    public function setFuel(string $fuel): static { $this->fuel = $fuel; return $this; }
    public function getObservations(): ?string { return $this->observations; }
    public function setObservations(?string $obs): static { $this->observations = $obs; return $this; }
    public function getMileagePhoto(): ?string { return $this->mileage_photo; }
    public function setMileagePhoto(string $photo): static { $this->mileage_photo = $photo; return $this; }
    public function getStartDate(): ?\DateTimeInterface { return $this->start_date; }
    public function setStartDate(\DateTimeInterface $date): static { $this->start_date = $date; return $this; }
    public function getEndDate(): ?\DateTimeInterface { return $this->end_date; }
    public function setEndDate(\DateTimeInterface $date): static { $this->end_date = $date; return $this; }
    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getComission(): ?Comission { return $this->comission; }
    public function setComission(?Comission $comission): static { $this->comission = $comission; return $this; }
}
