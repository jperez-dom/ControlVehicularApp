<?php

namespace App\Controller\Api;

use App\Entity\Comission;
use App\Entity\Driver;
use App\Entity\Vehicle;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ComissionController extends AbstractController
{
    // Listar solo fichas activas
    #[Route('/api/comissions', name: 'api_comission_list', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $comissions = $em->getRepository(Comission::class)->findBy(['status' => '1']);

        $data = array_map(fn($c) => [
            'id' => $c->getId(),
            'folio' => $c->getFolio(),
            'driver' => $c->getDriver()?->getName(),
            'vehicle' => $c->getVehicle()?->getModel() . ' ' . $c->getVehicle()?->getBrand(),
            'city' => $c->getCity(),
            'state' => $c->getState(),
            'status' => $c->getStatus(),
            'created_at' => $c->getCreatedAt()?->format('Y-m-d H:i:s'),
        ], $comissions);

        return new JsonResponse($data);
    }

    // Crear una nueva ficha
    #[Route('/api/comissions', name: 'api_comission_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['driver_id']) || !isset($data['vehicle_id']) || !isset($data['user_id'])) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Conductor, vehículo y usuario son obligatorios'
            ], 400);
        }

        $driver = $em->getRepository(Driver::class)->find($data['driver_id']);
        $vehicle = $em->getRepository(Vehicle::class)->find($data['vehicle_id']);
        $user = $em->getRepository(\App\Entity\Users::class)->find($data['user_id']);

        if (!$driver || !$vehicle || !$user) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Conductor, vehículo o usuario no encontrado'
            ], 404);
        }

        $comission = new Comission();
        $comission->setFolio((int)(date('ymd') . str_pad((string)rand(1, 999), 3, '0', STR_PAD_LEFT)));
        $comission->setDriver($driver);
        $comission->setVehicle($vehicle);
        $comission->setUser($user);
        $comission->setDate(new \DateTime());
        $comission->setCity($data['city'] ?? 'Por definir');
        $comission->setState($data['state'] ?? 'Por definir');
        $comission->setStatus('1');
        $comission->setDescription($data['description'] ?? null);
        $comission->setCreatedAt(new \DateTimeImmutable());
        $comission->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($comission);
        $em->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Ficha creada correctamente',
            'comission' => [
                'id' => $comission->getId(),
                'folio' => $comission->getFolio(),
                'driver' => $driver->getName(),
                'vehicle' => $vehicle->getModel() . ' ' . $vehicle->getBrand(),
                'city' => $comission->getCity(),
                'state' => $comission->getState(),
                'status' => $comission->getStatus(),
                'created_at' => $comission->getCreatedAt()?->format('Y-m-d H:i:s'),
            ]
        ], 201);
    }

    // Borrado lógico
    #[Route('/api/comissions/folio/{folio}', name: 'delete_comission_by_folio', methods: ['DELETE'])]
    public function deleteByFolio(string $folio, EntityManagerInterface $em): JsonResponse
    {
        try {
            $comission = $em->getRepository(Comission::class)->findOneBy(['folio' => $folio]);

            if (!$comission) {
                return new JsonResponse(['success' => false, 'message' => 'Ficha no encontrada.'], 404);
            }

            // cambiar status a 0
            $comission->setStatus('0');
            $em->flush();

            return new JsonResponse([
                'success' => true,
                'message' => "Ficha con folio {$folio} marcada como eliminada (status = 0)."
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Error al intentar marcar la ficha como eliminada: ' . $e->getMessage()
            ], 500);
        }
    }

    // Restaurar ficha eliminada
    #[Route('/api/comissions/folio/{folio}/restore', name: 'restore_comission_by_folio', methods: ['PATCH'])]
    public function restoreByFolio(string $folio, EntityManagerInterface $em): JsonResponse
    {
        $comission = $em->getRepository(Comission::class)->findOneBy(['folio' => $folio]);

        if (!$comission) {
            return new JsonResponse(['success' => false, 'message' => 'Ficha no encontrada.'], 404);
        }

        if ($comission->getStatus() === '1') {
            return new JsonResponse(['success' => false, 'message' => 'La ficha ya está activa.']);
        }

        $comission->setStatus('1');
        $em->flush();

        return new JsonResponse([
            'success' => true,
            'message' => "Ficha con folio {$folio} restaurada correctamente (status = 1)."
        ]);
    }
}
