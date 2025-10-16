<?php

namespace App\Controller\Api;

use App\Entity\Place;
use App\Entity\Comission;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class PlaceController extends AbstractController
{
    #[Route('/api/places', name: 'api_place_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $comission = $em->getRepository(Comission::class)->find($data['comission_id'] ?? 0);

        if (!$comission) {
            return new JsonResponse(['success' => false, 'message' => 'Ficha no encontrada'], 404);
        }

        $place = new Place();
        $place->setCity($data['city'] ?? '');
        $place->setState($data['state'] ?? '');
        $place->setComment($data['comment'] ?? null);
        $place->setComission($comission);
        $place->setCreatedAt(new \DateTimeImmutable());

        $em->persist($place);
        $em->flush();

        return new JsonResponse(['success' => true, 'message' => 'Destino agregado correctamente']);
    }
}
