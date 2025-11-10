<?php

namespace App\Entity;

use App\Repository\ComissionRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;

#[ORM\Entity(repositoryClass: ComissionRepository::class)]
#[ORM\Table(name: "comission")]
#[ORM\HasLifecycleCallbacks]
class Comission
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 255, unique: true)]
    private ?string $folio = null;

    #[ORM\Column(length: 50)]
    private ?string $city = null;

    #[ORM\Column(length: 50)]
    private ?string $state = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: Types::STRING, length: 1, options: ["default" => "1"])]
    private ?string $status = '1';

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true, options: ["default" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true, options: ["default" => "CURRENT_TIMESTAMP", "on update" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\ManyToOne(targetEntity: Vehicle::class, inversedBy: "comissions")]
    #[ORM\JoinColumn(nullable: false)]
    private ?Vehicle $vehicle = null;

    #[ORM\ManyToOne(targetEntity: Driver::class, inversedBy: "comissions")]
    #[ORM\JoinColumn(nullable: false)]
    private ?Driver $driver = null;

    #[ORM\ManyToOne(targetEntity: Users::class, inversedBy: "comissions")]
    #[ORM\JoinColumn(nullable: false)]
    private ?Users $user = null;

    #[ORM\OneToMany(mappedBy: "comission", targetEntity: DeparturePass::class)]
    private Collection $departurePasses;

    #[ORM\OneToMany(mappedBy: "comission", targetEntity: Place::class)]
    private Collection $places;

    public function __construct()
    {
        $this->departurePasses = new ArrayCollection();
        $this->places = new ArrayCollection();
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
    public function getFolio(): ?string { return $this->folio; }
    public function setFolio(string $folio): static { $this->folio = $folio; return $this; }
    public function getCity(): ?string { return $this->city; }
    public function setCity(string $city): static { $this->city = $city; return $this; }
    public function getState(): ?string { return $this->state; }
    public function setState(string $state): static { $this->state = $state; return $this; }
    public function getDate(): ?\DateTimeInterface { return $this->date; }
    public function setDate(\DateTimeInterface $date): static { $this->date = $date; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }
    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getCreatedAt(): ?\DateTimeInterface { return $this->created_at; }
    public function setCreatedAt(?\DateTimeInterface $created_at): static { $this->created_at = $created_at; return $this; }
    public function getUpdatedAt(): ?\DateTimeInterface { return $this->updated_at; }
    public function setUpdatedAt(?\DateTimeInterface $updated_at): static { $this->updated_at = $updated_at; return $this; }
    public function getVehicle(): ?Vehicle { return $this->vehicle; }
    public function setVehicle(?Vehicle $vehicle): static { $this->vehicle = $vehicle; return $this; }
    public function getDriver(): ?Driver { return $this->driver; }
    public function setDriver(?Driver $driver): static { $this->driver = $driver; return $this; }
    public function getUser(): ?Users { return $this->user; }
    public function setUser(?Users $user): static { $this->user = $user; return $this; }

    /**
     * @return Collection<int, DeparturePass>
     */
    public function getDeparturePasses(): Collection
    {
        return $this->departurePasses;
    }

    public function addDeparturePass(DeparturePass $departurePass): static
    {
        if (!$this->departurePasses->contains($departurePass)) {
            $this->departurePasses->add($departurePass);
            $departurePass->setComission($this);
        }
        return $this;
    }

    public function removeDeparturePass(DeparturePass $departurePass): static
    {
        if ($this->departurePasses->removeElement($departurePass)) {
            // set the owning side to null (unless already changed)
            if ($departurePass->getComission() === $this) {
                $departurePass->setComission(null);
            }
        }
        return $this;
    }

    public function getPlaces(): Collection { return $this->places; }
    public function addPlace(Place $place): static
    {
        if (!$this->places->contains($place)) {
            $this->places->add($place);
            $place->setComission($this);
        }
        return $this;
    }
    public function removePlace(Place $place): static
    {
        if ($this->places->removeElement($place) && $place->getComission() === $this) {
            $place->setComission(null);
        }
        return $this;
    }
}
