<?php

namespace App\Controller\Api;

use App\Entity\Inspection;
use App\Entity\Pass;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class InspectionController extends AbstractController
{
    #[Route('/api/inspections', name: 'api_inspection_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (!isset($data['pass_id'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'El ID del pase es obligatorio.'
                ], 400);
            }

            $pass = $em->getRepository(Pass::class)->find($data['pass_id']);
            if (!$pass) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'El pase especificado no existe.'
                ], 404);
            }

            $inspection = new Inspection();
            $inspection->setPass($pass);
            $inspection->setType($data['type'] ?? '');
            $inspection->setPart($data['part'] ?? '');
            $inspection->setComment($data['comment'] ?? '');
            $inspection->setStatus('1');
            $inspection->setCreatedAt(new \DateTimeImmutable());
            $inspection->setUpdatedAt(new \DateTimeImmutable());

            $em->persist($inspection);
            $em->flush();

            // 🔹 Guardar firmas si vienen en base64
            $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/signatures/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Firma del conductor
            if (!empty($data['signature_conductor'])) {
                $path = $uploadDir . 'signature_conductor_' . $inspection->getId() . '.png';
                $this->saveBase64Image($data['signature_conductor'], $path);
                $inspection->setSignatureConductor('/uploads/signatures/signature_conductor_' . $inspection->getId() . '.png');
            }

            // Firma del aprobador
            if (!empty($data['signature_approver'])) {
                $path = $uploadDir . 'signature_approver_' . $inspection->getId() . '.png';
                $this->saveBase64Image($data['signature_approver'], $path);
                $inspection->setSignatureApprover('/uploads/signatures/signature_approver_' . $inspection->getId() . '.png');
            }

            $em->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Inspección registrada correctamente',
                'inspection' => [
                    'id' => $inspection->getId(),
                    'pass_id' => $inspection->getPass()->getId(),
                    'signature_conductor' => $inspection->getSignatureConductor(),
                    'signature_approver' => $inspection->getSignatureApprover(),
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Error al crear inspección: ' . $e->getMessage()
            ], 500);
        }
    }



    private function saveBase64Image(string $base64Data, string $outputPath): void
    {
        $base64Data = preg_replace('#^data:image/\w+;base64,#i', '', $base64Data);
        $imageData = base64_decode($base64Data);
        file_put_contents($outputPath, $imageData);
    }
}
