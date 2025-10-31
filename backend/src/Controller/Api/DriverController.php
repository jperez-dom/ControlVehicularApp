<?php

namespace App\Controller\Api;

use App\Entity\Driver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class DriverController extends AbstractController
{
    #[Route('/api/drivers', name: 'api_driver_list', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $drivers = $em->getRepository(Driver::class)->findBy(['status' => '1']);

        $data = array_map(fn($d) => [
            'id' => $d->getId(),
            'name' => $d->getName(),
            'position' => $d->getPosition(),
            'phone' => $d->getPhone(),
            'email' => $d->getEmail(),
        ], $drivers);

        return new JsonResponse($data);
    }

    #[Route('/api/drivers', name: 'api_driver_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['name']) || !isset($data['position'])) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Nombre y cargo son obligatorios'
            ], 400);
        }

        $driver = new Driver();
        $driver->setName($data['name']);
        $driver->setPosition($data['position']);
        $driver->setPhone($data['phone'] ?? '');
        $driver->setEmail($data['email'] ?? '');
        $driver->setStatus('1');
        $driver->setCreatedAt(new \DateTimeImmutable());
        $driver->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($driver);
        $em->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Conductor creado correctamente',
            'driver' => [
                'id' => $driver->getId(),
                'name' => $driver->getName(),
                'position' => $driver->getPosition(),
                'phone' => $driver->getPhone(),
                'email' => $driver->getEmail(),
            ]
        ], 201);
    }

    #[Route('/api/drivers/{id}', name: 'api_driver_delete', methods: ['DELETE'])]
    public function delete(int $id, EntityManagerInterface $em): JsonResponse
    {
        $driver = $em->getRepository(Driver::class)->find($id);

        if (!$driver) {
            return new JsonResponse(['success' => false, 'message' => 'Conductor no encontrado'], 404);
        }

        $driver->setStatus('0');
        $driver->setUpdatedAt(new \DateTimeImmutable());

        $em->flush();

        return new JsonResponse(['success' => true, 'message' => 'Conductor eliminado correctamente']);
    }
}
