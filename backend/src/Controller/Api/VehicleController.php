<?php

namespace App\Controller\Api;

use App\Entity\Vehicle;
use App\Repository\VehicleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/vehicles', name: 'api_vehicles')]
final class VehicleController extends AbstractController
{
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['error' => 'No data found.'], 400);
        }
        $vehicle = new \App\Entity\Vehicle();
        $vehicle->setPlate($data['plate']??'');
        $vehicle->setBrand($data['brand']??'');
        $vehicle->setModel($data['model']??'');
        $vehicle->setYear($data['year']??'');
        $vehicle->setColor($data['color']??'');
        $vehicle->setInternalNumber($data['internalNumber']??'');

        $em->persist($vehicle);
        $em->flush();
        return $this->json($vehicle,201, [], ['groups' => 'vehicle:read']);
    }
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $vehicles = $em->getRepository(Vehicle::class)->findAll();

        $data =[];
        foreach ($vehicles as $vehicle) {
            $data[] = [
                'id' => $vehicle->getId(),
                'plate' => $vehicle->getPlate(),
                'brand' => $vehicle->getBrand(),
                'model' => $vehicle->getModel(),
                'year' => $vehicle->getYear(),
                'color' => $vehicle->getColor(),
                'internalNumber' => $vehicle->getInternalNumber(),
            ];
        }
        return $this->json($data);
    }
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $vehicle = $em->getRepository(Vehicle::class)->find($id);
        if (!$vehicle) {
            return $this->json(['error' => 'Vehiculo no encontrado.'], 404);
        }
        $data = json_decode($request->getContent(), true);
        $vehicle->setPlate($data['plate'] ?? $vehicle->getPlate());
        $vehicle->setBrand($data['brand'] ?? $vehicle->getBrand());
        $vehicle->setModel($data['model'] ?? $vehicle->getModel());
        $vehicle->setYear($data['year'] ?? $vehicle->getYear());
        $vehicle->setColor($data['color'] ?? $vehicle->getColor());
        $vehicle->setInternalNumber($data['internalNumber'] ?? $vehicle->getInternalNumber());

        $em->flush();

        return $this->json([
            'message' => 'Vehiculo actualizado correctamente',
            'vehicle' => $vehicle]);
    }
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, EntityManagerInterface $em): JsonResponse
    {
        $vehicle = $em->getRepository(Vehicle::class)->find($id);
        if (!$vehicle) {
            return $this->json(['error' => 'Vehiculo no encontrado'], 404);
        }
        $em->remove($vehicle);
        $em->flush();

        return $this->json(['message' => 'Vehiculo eliminado correctamente']);
    }
}
