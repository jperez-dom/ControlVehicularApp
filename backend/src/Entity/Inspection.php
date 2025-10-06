<?php

namespace App\Entity;

use App\Repository\InspectionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InspectionRepository::class)]
#[ORM\Table(name: "inspection")]
class Inspection
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer", unsigned: true)]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    private ?string $type = null;

    #[ORM\Column(length: 50)]
    private ?string $part = null;

    #[ORM\Column(type: "text", nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(length: 1)]
    private ?string $status = '1';

    #[ORM\Column(type: "datetime")]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: "datetime", nullable: true)]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\ManyToOne(targetEntity: Pass::class, inversedBy: "inspections")]
    #[ORM\JoinColumn(nullable: false)]
    private ?Pass $pass = null;

    // Getters & Setters
    public function getId(): ?int { return $this->id; }
    public function getType(): ?string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }
    public function getPart(): ?string { return $this->part; }
    public function setPart(string $part): static { $this->part = $part; return $this; }
    public function getComment(): ?string { return $this->comment; }
    public function setComment(?string $comment): static { $this->comment = $comment; return $this; }
    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getPass(): ?Pass { return $this->pass; }
    public function setPass(?Pass $pass): static { $this->pass = $pass; return $this; }
}
