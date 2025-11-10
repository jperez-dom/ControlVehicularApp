<?php

namespace App\Entity;

use App\Repository\InspectionRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\DBAL\Types\Types;

#[ORM\Entity(repositoryClass: InspectionRepository::class)]
#[ORM\Table(name: "inspection")]
#[ORM\HasLifecycleCallbacks]
class Inspection
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    private ?string $type = null;

    #[ORM\Column(length: 50)]
    private ?string $part = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $moment = null; // 'departure' or 'arrival'

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $photo_url = null;

    #[ORM\Column(type: Types::STRING, length: 1, options: ["default" => "1"])]
    private ?string $status = '1';

    #[ORM\Column(type: Types::DATETIME_MUTABLE, name: "created_at", nullable: true, options: ["default" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, name: "updated_at", nullable: true, options: ["default" => "CURRENT_TIMESTAMP", "on update" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\ManyToOne(targetEntity: DeparturePass::class, inversedBy: "inspections")]
    #[ORM\JoinColumn(nullable: false)]
    private ?DeparturePass $departurePass = null;

    public function __construct()
    {
        $this->status = '1';
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // Getters and Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getPart(): ?string
    {
        return $this->part;
    }

    public function setPart(string $part): static
    {
        $this->part = $part;
        return $this;
    }

    public function getMoment(): ?string
    {
        return $this->moment;
    }

    public function setMoment(?string $moment): static
    {
        $this->moment = $moment;
        return $this;
    }

    public function getComment(): ?string
    {
        return $this->comment;
    }

    public function setComment(?string $comment): static
    {
        $this->comment = $comment;
        return $this;
    }

    public function getPhotoUrl(): ?string
    {
        return $this->photo_url;
    }

    public function setPhotoUrl(?string $photo_url): static
    {
        $this->photo_url = $photo_url;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(?\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function getDeparturePass(): ?DeparturePass
    {
        return $this->departurePass;
    }

    public function setDeparturePass(?DeparturePass $departurePass): static
    {
        $this->departurePass = $departurePass;
        return $this;
    }
}
