<?php

namespace App\Entity;

use App\Repository\VehicleRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: VehicleRepository::class)]
#[ORM\Table(name: "vehicle")]
class Vehicle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer", unsigned: true)]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    private ?string $plate = null;

    #[ORM\Column(length: 50)]
    private ?string $brand = null;

    #[ORM\Column(length: 50)]
    private ?string $model = null;

    #[ORM\Column(type: "integer")]
    private ?int $year = null;

    #[ORM\Column(length: 50)]
    private ?string $color = null;

    #[ORM\Column(type: "integer", nullable: true)]
    private ?int $internal_number = null;

    #[ORM\Column(length: 1)]
    private ?string $status = '1';

    #[ORM\Column(type: "datetime")]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: "datetime", nullable: true)]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\OneToMany(mappedBy: "vehicle", targetEntity: Comission::class)]
    private Collection $comissions;

    public function __construct()
    {
        $this->comissions = new ArrayCollection();
    }

    // Getters / Setters ↓↓↓

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

    public function getInternalNumber(): ?int { return
