<?php

namespace App\Entity;

use App\Repository\DeparturePassRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: DeparturePassRepository::class)]
#[ORM\Table(name: "departure_pass")]
#[ORM\HasLifecycleCallbacks]
class DeparturePass
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $departureMileage = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $departureFuel = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $departureComment = null;

    #[ORM\Column(type: Types::STRING, length: 1, options: ["default" => "1"])]
    private ?string $status = '1';

    #[ORM\Column(type: Types::DATETIME_MUTABLE, name: "created_at", nullable: true, options: ["default" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, name: "updated_at", nullable: true, options: ["default" => "CURRENT_TIMESTAMP", "on update" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\ManyToOne(targetEntity: Comission::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Comission $comission = null;

    #[ORM\OneToMany(mappedBy: "departurePass", targetEntity: Inspection::class, cascade: ["persist", "remove"])]
    private Collection $inspections;

    #[ORM\OneToOne(mappedBy: "departurePass", targetEntity: ArrivalPass::class, cascade: ["persist", "remove"])]
    private ?ArrivalPass $arrivalPass = null;

    public function __construct()
    {
        $this->inspections = new ArrayCollection();
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

    public function getStartDate(): ?\DateTimeInterface
    {
        return $this->startDate;
    }

    public function setStartDate(\DateTimeInterface $startDate): static
    {
        $this->startDate = $startDate;
        return $this;
    }

    public function getDepartureMileage(): ?int
    {
        return $this->departureMileage;
    }

    public function setDepartureMileage(?int $departureMileage): static
    {
        $this->departureMileage = $departureMileage;
        return $this;
    }

    public function getDepartureFuel(): ?string
    {
        return $this->departureFuel;
    }

    public function setDepartureFuel(?string $departureFuel): static
    {
        $this->departureFuel = $departureFuel;
        return $this;
    }

    public function getDepartureComment(): ?string
    {
        return $this->departureComment;
    }

    public function setDepartureComment(?string $departureComment): static
    {
        $this->departureComment = $departureComment;
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

    public function getComission(): ?Comission
    {
        return $this->comission;
    }

    public function setComission(?Comission $comission): static
    {
        $this->comission = $comission;
        return $this;
    }

    /**
     * @return Collection<int, Inspection>
     */
    public function getInspections(): Collection
    {
        return $this->inspections;
    }

    public function addInspection(Inspection $inspection): static
    {
        if (!$this->inspections->contains($inspection)) {
            $this->inspections->add($inspection);
            $inspection->setDeparturePass($this);
        }
        return $this;
    }

    public function removeInspection(Inspection $inspection): static
    {
        if ($this->inspections->removeElement($inspection)) {
            // set the owning side to null (unless already changed)
            if ($inspection->getDeparturePass() === $this) {
                $inspection->setDeparturePass(null);
            }
        }
        return $this;
    }

    public function getArrivalPass(): ?ArrivalPass
    {
        return $this->arrivalPass;
    }

    public function setArrivalPass(ArrivalPass $arrivalPass): static
    {
        // set the owning side of the relation if necessary
        if ($arrivalPass->getDeparturePass() !== $this) {
            $arrivalPass->setDeparturePass($this);
        }

        $this->arrivalPass = $arrivalPass;
        return $this;
    }
}
