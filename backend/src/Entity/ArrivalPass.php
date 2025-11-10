<?php

namespace App\Entity;

use App\Repository\ArrivalPassRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ArrivalPassRepository::class)]
#[ORM\Table(name: "arrival_pass")]
#[ORM\HasLifecycleCallbacks]
class ArrivalPass
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $arrivalMileage = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $arrivalFuel = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $arrivalComment = null;

    #[ORM\Column(type: Types::STRING, length: 1, options: ["default" => "1"])]
    private ?string $status = '1';

    #[ORM\Column(type: Types::DATETIME_MUTABLE, name: "created_at", nullable: true, options: ["default" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, name: "updated_at", nullable: true, options: ["default" => "CURRENT_TIMESTAMP", "on update" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\OneToOne(inversedBy: "arrivalPass", targetEntity: DeparturePass::class)]
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

    public function getEndDate(): ?\DateTimeInterface
    {
        return $this->endDate;
    }

    public function setEndDate(\DateTimeInterface $endDate): static
    {
        $this->endDate = $endDate;
        return $this;
    }

    public function getArrivalMileage(): ?int
    {
        return $this->arrivalMileage;
    }

    public function setArrivalMileage(?int $arrivalMileage): static
    {
        $this->arrivalMileage = $arrivalMileage;
        return $this;
    }

    public function getArrivalFuel(): ?string
    {
        return $this->arrivalFuel;
    }

    public function setArrivalFuel(?string $arrivalFuel): static
    {
        $this->arrivalFuel = $arrivalFuel;
        return $this;
    }

    public function getArrivalComment(): ?string
    {
        return $this->arrivalComment;
    }

    public function setArrivalComment(?string $arrivalComment): static
    {
        $this->arrivalComment = $arrivalComment;
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
