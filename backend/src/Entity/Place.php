<?php

namespace App\Entity;

use App\Repository\PlaceRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PlaceRepository::class)]
#[ORM\Table(name: "place")]
class Place
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer", unsigned: true)]
    private ?int $id = null;

    #[ORM\Column(length: 150)]
    private ?string $state = null;

    #[ORM\Column(length: 150)]
    private ?string $city = null;

    #[ORM\Column(length: 1)]
    private ?string $status = '1';

    #[ORM\Column(type: "text", nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(type: "datetime")]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: "datetime", nullable: true)]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\ManyToOne(targetEntity: Comission::class, inversedBy: "places")]
    #[ORM\JoinColumn(nullable: false)]
    private ?Comission $comission = null;

    // Getters & Setters
    public function getId(): ?int { return $this->id; }
    public function getState(): ?string { return $this->state; }
    public function setState(string $state): static { $this->state = $state; return $this; }
    public function getCity(): ?string { return $this->city; }
    public function setCity(string $city): static { $this->city = $city; return $this; }
    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getComment(): ?string { return $this->comment; }
    public function setComment(?string $comment): static { $this->comment = $comment; return $this; }
    public function getComission(): ?Comission { return $this->comission; }
    public function setComission(?Comission $comission): static { $this->comission = $comission; return $this; }
}
