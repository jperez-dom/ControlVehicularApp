<?php

namespace App\Controller\Api;

use App\Entity\Vehicle;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class VehicleController extends AbstractController
{
    #[Route('/api/vehicles', name: 'api_vehicle_list', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $vehicles = $em->getRepository(Vehicle::class)->findBy(['status' => '1']);

        $data = array_map(fn($v) => [
            'id' => $v->getId(),
            'plate' => $v->getPlate(),
            'model' => $v->getModel(),
            'brand' => $v->getBrand(),
            'year' => $v->getYear(),
            'color' => $v->getColor(),
            'internal_number' => $v->getInternalNumber(),
        ], $vehicles);

        return new JsonResponse($data);
    }

    #[Route('/api/vehicles', name: 'api_vehicle_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['brand']) || !isset($data['model'])) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Marca y modelo son obligatorios'
            ], 400);
        }

        $vehicle = new Vehicle();
        $vehicle->setBrand($data['brand']);
        $vehicle->setModel($data['model']);
        $vehicle->setPlate($data['plate'] ?? '');
        $vehicle->setYear($data['year'] ?? date('Y'));
        $vehicle->setColor($data['color'] ?? '');
        $vehicle->setInternalNumber($data['internal_number'] ?? null);
        $vehicle->setStatus('1');
        $vehicle->setCreatedAt(new \DateTimeImmutable());
        $vehicle->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($vehicle);
        $em->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Vehículo creado correctamente',
            'vehicle' => [
                'id' => $vehicle->getId(),
                'plate' => $vehicle->getPlate(),
                'brand' => $vehicle->getBrand(),
                'model' => $vehicle->getModel(),
                'year' => $vehicle->getYear(),
                'color' => $vehicle->getColor(),
                'internal_number' => $vehicle->getInternalNumber(),
            ]
        ], 201);
    }

    #[Route('/api/vehicles/{id}', name: 'api_vehicle_delete', methods: ['DELETE'])]
    public function delete(int $id, EntityManagerInterface $em): JsonResponse
    {
        $vehicle = $em->getRepository(Vehicle::class)->find($id);

        if (!$vehicle) {
            return new JsonResponse(['success' => false, 'message' => 'Vehículo no encontrado'], 404);
        }

        $vehicle->setStatus('0');
        $vehicle->setUpdatedAt(new \DateTimeImmutable());

        $em->flush();

        return new JsonResponse(['success' => true, 'message' => 'Vehículo eliminado correctamente']);
    }
}
