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

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $photo_url = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $signature_conductor = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $signature_approver = null;

    #[ORM\Column(type: Types::STRING, length: 1, options: ["default" => "1"])]
    private ?string $status = '1';

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true, options: ["default" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true, options: ["default" => "CURRENT_TIMESTAMP", "on update" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\ManyToOne(targetEntity: Pass::class, inversedBy: "inspections")]
    #[ORM\JoinColumn(nullable: false)]
    private ?Pass $pass = null;

    public function __construct()
    {
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
    public function getType(): ?string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }
    public function getPart(): ?string { return $this->part; }
    public function setPart(string $part): static { $this->part = $part; return $this; }
    public function getComment(): ?string { return $this->comment; }
    public function setComment(?string $comment): static { $this->comment = $comment; return $this; }
    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getCreatedAt(): ?\DateTimeInterface { return $this->created_at; }
    public function setCreatedAt(?\DateTimeInterface $created_at): static { $this->created_at = $created_at; return $this; }
    public function getUpdatedAt(): ?\DateTimeInterface { return $this->updated_at; }
    public function setUpdatedAt(?\DateTimeInterface $updated_at): static { $this->updated_at = $updated_at; return $this; }
    public function getPass(): ?Pass { return $this->pass; }
    public function setPass(?Pass $pass): static { $this->pass = $pass; return $this; }
    public function getPhotoUrl(): ?string { return $this->photo_url; }
    public function setPhotoUrl(?string $photo_url): static { $this->photo_url = $photo_url; return $this; }
    public function getSignatureConductor(): ?string { return $this->signature_conductor; }
    public function setSignatureConductor(?string $signature_conductor): static { $this->signature_conductor = $signature_conductor; return $this; }
    public function getSignatureApprover(): ?string { return $this->signature_approver; }
    public function setSignatureApprover(?string $signature_approver): static { $this->signature_approver = $signature_approver; return $this; }
}
