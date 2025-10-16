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

        if (!isset($data['comission_id']) || empty($data['comission_id'])) {
            return new JsonResponse([
                'success' => false,
                'message' => 'El Folio de la comisión es obligatorio.'
            ], 400);
        }

        $comissionFolio = $data['comission_id'];
        $comission = $em->getRepository(Comission::class)->findOneBy(['folio' => $comissionFolio]);

        if (!$comission) {
            return new JsonResponse([
                'success' => false,
                'message' => "Ficha no encontrada (Folio: {$comissionFolio})."
            ], 404);
        }

        // 1. CREAR EL PASE (PASS)
        $pass = new Pass();
        $pass->setComission($comission);
        $pass->setMileage($data['mileage'] ?? 0);
        $pass->setFuel($data['fuel'] ?? '8');
        // El campo Observations (comentario general) se gestiona a través de una Inspection
        // Si la entidad Pass todavía requiere este campo por Symfony, se mantendrá el valor por defecto:
        // $pass->setObservations($data['comment'] ?? null);
        // ❌ ELIMINAMOS O HACEMOS NULL LOS CAMPOS REDUNDANTES EN PASS
        $pass->setObservations(null); // Asumimos que la entidad Pass puede recibir null
        // $pass->setMileagePhoto(''); // Si la entidad Pass tiene este campo, debe eliminarse en la entidad Doctrine.
        $pass->setStartDate(isset($data['start_date']) ? new \DateTime($data['start_date']) : new \DateTime());
        $pass->setEndDate(new \DateTime('1970-01-01'));
        $pass->setStatus('1');
        $pass->setCreatedAt(new \DateTimeImmutable());
        $pass->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($pass);
        $em->flush();

        // Directorio de subida de firmas y fotos
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/';
        $signatureDir = $uploadDir . 'signatures/';
        $photoDir = $uploadDir . 'photos/'; // Aseguramos el directorio de fotos

        if (!is_dir($signatureDir)) {
            mkdir($signatureDir, 0777, true);
        }
        if (!is_dir($photoDir)) {
            mkdir($photoDir, 0777, true);
        }


        // 2. GUARDAR INSPECCIONES (FOTOS y COMENTARIO GENERAL)
        if (isset($data['inspections']) && is_array($data['inspections'])) {
            foreach ($data['inspections'] as $inspectionData) {

                // Inspección para el COMENTARIO GENERAL
                if (($inspectionData['part'] ?? '') === 'general_comment' && !empty($data['comment'])) {
                    $inspection = new Inspection();
                    $inspection->setPass($pass);
                    $inspection->setType('text');
                    $inspection->setPart('general_comment_salida');
                    $inspection->setComment($data['comment'] ?? null); // Guardar comentario general
                    $inspection->setStatus('1');
                    $inspection->setCreatedAt(new \DateTimeImmutable());
                    $inspection->setUpdatedAt(new \DateTimeImmutable());
                    $em->persist($inspection);
                    continue; // Pasa al siguiente elemento si solo fue el comentario
                }


                // Inspección para FOTOS (incluyendo Kilometraje)
                if (isset($inspectionData['photo']) && !empty($inspectionData['photo'])) {

                    $inspection = new Inspection();
                    $inspection->setPass($pass);
                    $inspection->setType($inspectionData['type'] ?? 'photo');
                    $inspection->setPart($inspectionData['part'] ?? 'vehicle');
                    $inspection->setComment($inspectionData['comment'] ?? null); // Comentario específico de la inspección
                    $inspection->setStatus('1');
                    $inspection->setCreatedAt(new \DateTimeImmutable());
                    $inspection->setUpdatedAt(new \DateTimeImmutable());

                    $em->persist($inspection);
                    $em->flush(); // Necesario para obtener el ID de la inspección

                    // Guardar la foto Base64 en disco
                    $photoPath = $photoDir . $inspection->getId() . '_' . $inspectionData['part'] . '.png';
                    $this->saveBase64Image($inspectionData['photo'], $photoPath);
                    $inspection->setPhotoUrl('/uploads/photos/' . $inspection->getId() . '_' . $inspectionData['part'] . '.png');

                    $em->persist($inspection);
                }
            }
        }

        // 3. GUARDAR FIRMAS (SALIDA)
        if (isset($data['signature_driver']) || isset($data['signature_approver'])) {
            $inspection = new Inspection();
            $inspection->setPass($pass);
            $inspection->setType('signature');
            $inspection->setPart('salida'); // Identificador para la firma de salida
            $inspection->setComment('Firmas de Salida');
            $inspection->setStatus('1');
            $inspection->setCreatedAt(new \DateTimeImmutable());
            $inspection->setUpdatedAt(new \DateTimeImmutable());

            $em->persist($inspection);
            $em->flush(); // Necesario para obtener el ID de la inspección

            // Firma del conductor
            if (!empty($data['signature_driver'])) {
                $path = $signatureDir . 'driver_salida_' . $inspection->getId() . '.png';
                $this->saveBase64Image($data['signature_driver'], $path);
                $inspection->setSignatureDriver('/uploads/signatures/driver_salida_' . $inspection->getId() . '.png');
            }

            // Firma del aprobador
            if (!empty($data['signature_approver'])) {
                $path = $signatureDir . 'approver_salida_' . $inspection->getId() . '.png';
                $this->saveBase64Image($data['signature_approver'], $path);
                $inspection->setSignatureApprover('/uploads/signatures/approver_salida_' . $inspection->getId() . '.png');
            }

            $em->persist($inspection);
        }

        $em->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Salida registrada correctamente',
            'pass_id' => $pass->getId()
        ]);
    }

    #[Route('/api/pass/entrada', name: 'api_pass_entrada', methods: ['POST'])]
    public function entrada(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $pass = $em->getRepository(Pass::class)->find($data['pass_id'] ?? 0);

        if (!$pass) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Pase no encontrado'
            ], 404);
        }

        // 1. ACTUALIZAR PASE (PASS)
        $pass->setEndDate(isset($data['end_date']) ? new \DateTime($data['end_date']) : new \DateTime());
        $pass->setMileage($data['mileage'] ?? $pass->getMileage());
        $pass->setFuel($data['fuel'] ?? $pass->getFuel());
        // ❌ ELIMINAMOS O HACEMOS NULL LOS CAMPOS REDUNDANTES EN PASS
        $pass->setObservations(null); // Asumimos que la entidad Pass puede recibir null
        // $pass->setMileagePhoto(''); // Si la entidad Pass tiene este campo, debe eliminarse en la entidad Doctrine.
        $pass->setUpdatedAt(new \DateTimeImmutable());
        $em->persist($pass);

        // Directorio de subida de firmas y fotos
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/';
        $signatureDir = $uploadDir . 'signatures/';
        $photoDir = $uploadDir . 'photos/';

        if (!is_dir($signatureDir)) {
            mkdir($signatureDir, 0777, true);
        }
        if (!is_dir($photoDir)) {
            mkdir($photoDir, 0777, true);
        }


        // 2. GUARDAR INSPECCIONES (FOTOS y COMENTARIO GENERAL) DE ENTRADA
        if (isset($data['inspections']) && is_array($data['inspections'])) {
            foreach ($data['inspections'] as $inspectionData) {

                // Inspección para el COMENTARIO GENERAL de ENTRADA
                if (($inspectionData['part'] ?? '') === 'general_comment_entry' && !empty($data['comment'])) {
                    $inspection = new Inspection();
                    $inspection->setPass($pass);
                    $inspection->setType('text');
                    $inspection->setPart('general_comment_entrada');
                    $inspection->setComment($data['comment'] ?? null); // Guardar comentario general
                    $inspection->setStatus('1');
                    $inspection->setCreatedAt(new \DateTimeImmutable());
                    $inspection->setUpdatedAt(new \DateTimeImmutable());
                    $em->persist($inspection);
                    continue;
                }

                // Inspección para FOTOS de ENTRADA
                if (isset($inspectionData['photo']) && !empty($inspectionData['photo'])) {

                    $inspection = new Inspection();
                    $inspection->setPass($pass);
                    $inspection->setType($inspectionData['type'] ?? 'photo');
                    $inspection->setPart($inspectionData['part'] ?? 'vehicle');
                    $inspection->setComment($inspectionData['comment'] ?? null); // Comentario específico de la inspección
                    $inspection->setStatus('1');
                    $inspection->setCreatedAt(new \DateTimeImmutable());
                    $inspection->setUpdatedAt(new \DateTimeImmutable());

                    $em->persist($inspection);
                    $em->flush(); // Necesario para obtener el ID de la inspección

                    // Guardar la foto Base64 en disco
                    $photoPath = $photoDir . $inspection->getId() . '_' . $inspectionData['part'] . '.png';
                    $this->saveBase64Image($inspectionData['photo'], $photoPath);
                    $inspection->setPhotoUrl('/uploads/photos/' . $inspection->getId() . '_' . $inspectionData['part'] . '.png');

                    $em->persist($inspection);
                }
            }
        }

        // 3. GUARDAR FIRMAS (ENTRADA)
        if (isset($data['signature_driver']) || isset($data['signature_approver'])) {
            $inspection = new Inspection();
            $inspection->setPass($pass);
            $inspection->setType('signature');
            $inspection->setPart('entrada'); // Identificador para la firma de entrada
            $inspection->setComment('Firmas de Entrada');
            $inspection->setStatus('1');
            $inspection->setCreatedAt(new \DateTimeImmutable());
            $inspection->setUpdatedAt(new \DateTimeImmutable());

            $em->persist($inspection);
            $em->flush();

            // Firma del conductor
            if (!empty($data['signature_driver'])) {
                $path = $signatureDir . 'driver_entrada_' . $inspection->getId() . '.png';
                $this->saveBase64Image($data['signature_driver'], $path);
                $inspection->setSignatureDriver('/uploads/signatures/driver_entrada_' . $inspection->getId() . '.png');
            }

            // Firma del aprobador
            if (!empty($data['signature_approver'])) {
                $path = $signatureDir . 'approver_entrada_' . $inspection->getId() . '.png';
                $this->saveBase64Image($data['signature_approver'], $path);
                $inspection->setSignatureApprover('/uploads/signatures/approver_entrada_' . $inspection->getId() . '.png');
            }

            $em->persist($inspection);
        }

        $em->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Entrada registrada correctamente',
            'pass_id' => $pass->getId()
        ]);
    }

    // FUNCIÓN AUXILIAR PARA GUARDAR IMÁGENES BASE64
    private function saveBase64Image(string $base64Data, string $outputPath): void
    {
        // Limpiar el prefijo de la imagen Base64
        $base64Data = preg_replace('#^data:image/\w+;base64,#i', '', $base64Data);
        $imageData = base64_decode($base64Data);

        // Asegurar que el directorio existe antes de escribir el archivo
        $dir = dirname($outputPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        file_put_contents($outputPath, $imageData);
    }
}
