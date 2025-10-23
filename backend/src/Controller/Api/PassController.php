<?php

namespace App\Controller\Api;

use App\Entity\Comission;
use App\Entity\Pass;
use App\Entity\Inspection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class PassController extends AbstractController
{
    #[Route('/api/pass/salida', name: 'api_pass_salida', methods: ['POST'])]
    public function salida(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['pass_id']) && !empty($data['pass_id'])) {
            $pass = $em->getRepository(Pass::class)->find($data['pass_id']);
            if (!$pass) {
                return new JsonResponse(['success' => false, 'message' => 'El pase a actualizar no fue encontrado.'], 404);
            }
        } else {
            if (!isset($data['comission_id']) || empty($data['comission_id'])) {
                return new JsonResponse(['success' => false, 'message' => 'El Folio de la comisión es obligatorio para crear un nuevo pase.'], 400);
            }
            $comission = $em->getRepository(Comission::class)->findOneBy(['folio' => $data['comission_id']]);
            if (!$comission) {
                return new JsonResponse(['success' => false, 'message' => "Ficha no encontrada (Folio: {$data['comission_id']})."], 404);
            }
            $pass = new Pass();
            $pass->setComission($comission);
            $pass->setStartDate(isset($data['start_date']) ? new \DateTime($data['start_date']) : new \DateTime());
            $pass->setEndDate(new \DateTime('1970-01-01')); // Default date for not-yet-arrived
        }

        // Update fields
        $pass->setDepartureMileage($data['mileage'] ?? $pass->getDepartureMileage() ?? 0);
        $pass->setFuel($data['fuel'] ?? $pass->getFuel() ?? '8');
        $pass->setDepartureComment($data['departure_comment'] ?? $pass->getDepartureComment());
        $pass->setUpdatedAt(new \DateTimeImmutable());

        if (!$em->contains($pass)) {
            $em->persist($pass);
        }

        // Flush here to get the pass ID if it's new
        $em->flush();

        // --- Handle Inspections (Photos & Signatures) ---
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/';
        $signatureDir = $uploadDir . 'signatures/';
        $photoDir = $uploadDir . 'photos/';

        if (!is_dir($signatureDir)) mkdir($signatureDir, 0777, true);
        if (!is_dir($photoDir)) mkdir($photoDir, 0777, true);

        // Handle new photos
        if (isset($data['inspections']) && is_array($data['inspections'])) {
            foreach ($data['inspections'] as $inspectionData) {
                if (isset($inspectionData['photo']) && !empty($inspectionData['photo'])) {
                    $inspection = new Inspection();
                    $inspection->setPass($pass);
                    $inspection->setType($inspectionData['type'] ?? 'photo');
                    $inspection->setPart($inspectionData['part'] ?? 'vehicle');
                    $inspection->setComment($inspectionData['comment'] ?? null);
                    $inspection->setStatus('1');
                    $em->persist($inspection);
                    $em->flush(); // Flush to get inspection ID

                    $photoPath = $photoDir . $inspection->getId() . '_' . $inspectionData['part'] . '.png';
                    $this->saveBase64Image($inspectionData['photo'], $photoPath);
                    $inspection->setPhotoUrl('/uploads/photos/' . basename($photoPath));
                    $em->persist($inspection);
                }
            }
        }

        // Handle signatures (assuming they might be updated or added)
        if (!empty($data['signature_conductor']) || !empty($data['signature_approver'])) {
            $signatureInspection = $em->getRepository(Inspection::class)->findOneBy(['pass' => $pass, 'part' => 'salida', 'type' => 'signature']);
            if (!$signatureInspection) {
                $signatureInspection = new Inspection();
                $signatureInspection->setPass($pass);
                $signatureInspection->setType('signature');
                $signatureInspection->setPart('salida');
                $signatureInspection->setStatus('1');
                $em->persist($signatureInspection);
                $em->flush(); // Flush to get ID
            }

            if (!empty($data['signature_conductor'])) {
                $path = $signatureDir . 'conductor_salida_' . $signatureInspection->getId() . '.png';
                $this->saveBase64Image($data['signature_conductor'], $path);
                $signatureInspection->setSignatureConductor('/uploads/signatures/' . basename($path));
            }

            if (!empty($data['signature_approver'])) {
                $path = $signatureDir . 'approver_salida_' . $signatureInspection->getId() . '.png';
                $this->saveBase64Image($data['signature_approver'], $path);
                $signatureInspection->setSignatureApprover('/uploads/signatures/' . basename($path));
            }
            $em->persist($signatureInspection);
        }

        $em->flush();

        return new JsonResponse(['success' => true, 'message' => 'Salida registrada/actualizada correctamente', 'pass_id' => $pass->getId()]);
    }

    #[Route('/api/pass/entrada', name: 'api_pass_entrada', methods: ['POST'])]
    public function entrada(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $pass = $em->getRepository(Pass::class)->find($data['pass_id'] ?? 0);

        if (!$pass) {
            return new JsonResponse(['success' => false, 'message' => 'Pase no encontrado'], 404);
        }

        $pass->setEndDate(isset($data['end_date']) ? new \DateTime($data['end_date']) : new \DateTime());
        $pass->setArrivalMileage($data['mileage'] ?? $pass->getArrivalMileage());
        $pass->setFuel($data['fuel'] ?? $pass->getFuel());
        $pass->setArrivalComment($data['arrival_comment'] ?? null);
        $pass->setUpdatedAt(new \DateTimeImmutable());
        $em->persist($pass);

        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/';
        $signatureDir = $uploadDir . 'signatures/';
        $photoDir = $uploadDir . 'photos/';

        if (!is_dir($signatureDir)) mkdir($signatureDir, 0777, true);
        if (!is_dir($photoDir)) mkdir($photoDir, 0777, true);

        if (isset($data['inspections']) && is_array($data['inspections'])) {
            foreach ($data['inspections'] as $inspectionData) {
                if (isset($inspectionData['photo']) && !empty($inspectionData['photo'])) {
                    $inspection = new Inspection();
                    $inspection->setPass($pass);
                    $inspection->setType($inspectionData['type'] ?? 'photo');
                    $inspection->setPart($inspectionData['part'] ?? 'vehicle_entry');
                    $inspection->setComment($inspectionData['comment'] ?? null);
                    $inspection->setStatus('1');
                    $em->persist($inspection);
                    $em->flush();

                    $photoPath = $photoDir . $inspection->getId() . '_' . $inspectionData['part'] . '.png';
                    $this->saveBase64Image($inspectionData['photo'], $photoPath);
                    $inspection->setPhotoUrl('/uploads/photos/' . basename($photoPath));
                    $em->persist($inspection);
                }
            }
        }

        if (!empty($data['signature_conductor']) || !empty($data['signature_approver'])) {
            $inspection = $em->getRepository(Inspection::class)->findOneBy(['pass' => $pass, 'part' => 'entrada', 'type' => 'signature']);
            if (!$inspection) {
                $inspection = new Inspection();
                $inspection->setPass($pass);
                $inspection->setType('signature');
                $inspection->setPart('entrada');
                $inspection->setStatus('1');
                $em->persist($inspection);
                $em->flush();
            }

            if (!empty($data['signature_conductor'])) {
                $path = $signatureDir . 'conductor_entrada_' . $inspection->getId() . '.png';
                $this->saveBase64Image($data['signature_conductor'], $path);
                $inspection->setSignatureConductor('/uploads/signatures/' . basename($path));
            }

            if (!empty($data['signature_approver'])) {
                $path = $signatureDir . 'approver_entrada_' . $inspection->getId() . '.png';
                $this->saveBase64Image($data['signature_approver'], $path);
                $inspection->setSignatureApprover('/uploads/signatures/' . basename($path));
            }
            $em->persist($inspection);
        }

        $em->flush();

        return new JsonResponse(['success' => true, 'message' => 'Entrada registrada correctamente', 'pass_id' => $pass->getId()]);
    }

    private function saveBase64Image(string $base64Data, string $outputPath): void
    {
        $base64Data = preg_replace('#^data:image/\w+;base64,#i', '', $base64Data);
        $imageData = base64_decode($base64Data);

        $dir = dirname($outputPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        file_put_contents($outputPath, $imageData);
    }
}
