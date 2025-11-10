<?php

namespace App\Controller\Api;

use App\Entity\Comission;
use App\Entity\DeparturePass;
use App\Entity\ArrivalPass;
use App\Entity\Inspection;
use App\Service\FileUploader;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class PassController extends AbstractController
{
    private FileUploader $fileUploader;

    public function __construct(FileUploader $fileUploader)
    {
        $this->fileUploader = $fileUploader;
    }

    #[Route('/api/pass/salida', name: 'api_pass_salida', methods: ['POST'])]
    public function salida(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = $request->request->all();
        $comissionId = $data['comission_id'] ?? null;

        if (!$comissionId) {
            return new JsonResponse(['success' => false, 'message' => 'Se requiere "comission_id".'], 400);
        }

        $comission = $em->getRepository(Comission::class)->find($comissionId);
        if (!$comission) {
            return new JsonResponse(['success' => false, 'message' => "Ficha no encontrada (ID: {$comissionId})."], 404);
        }

        $departurePass = new DeparturePass();
        $departurePass->setComission($comission);
        $departurePass->setStartDate(new \DateTime());
        $departurePass->setDepartureMileage($data['mileage'] ?? 0);
        $departurePass->setDepartureFuel($data['fuel'] ?? '8');
        $departurePass->setDepartureComment($data['departure_comment'] ?? null);

        $this->handleInspections($request, $departurePass, 'departure');

        $em->persist($departurePass);
        $em->flush();

        return new JsonResponse(['success' => true, 'message' => 'Salida registrada correctamente', 'departure_pass_id' => $departurePass->getId()]);
    }

    #[Route('/api/pass/entrada', name: 'api_pass_entrada', methods: ['POST'])]
    public function entrada(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = $request->request->all();
        $departurePassId = $data['departure_pass_id'] ?? null;

        if (!$departurePassId) {
            return new JsonResponse(['success' => false, 'message' => 'Se requiere "departure_pass_id".'], 400);
        }

        $departurePass = $em->getRepository(DeparturePass::class)->find($departurePassId);
        if (!$departurePass) {
            return new JsonResponse(['success' => false, 'message' => 'Pase de salida no encontrado'], 404);
        }

        $arrivalPass = new ArrivalPass();
        $arrivalPass->setDeparturePass($departurePass);
        $arrivalPass->setEndDate(new \DateTime());
        $arrivalPass->setArrivalMileage($data['mileage'] ?? 0);
        $arrivalPass->setArrivalFuel($data['fuel'] ?? '8');
        $arrivalPass->setArrivalComment($data['arrival_comment'] ?? null);

        $this->handleInspections($request, $departurePass, 'arrival');

        $em->persist($arrivalPass);
        $em->flush();

        return new JsonResponse(['success' => true, 'message' => 'Entrada registrada correctamente', 'arrival_pass_id' => $arrivalPass->getId()]);
    }

    private function handleInspections(Request $request, DeparturePass $departurePass, string $moment): void
    {
        $inspectionsMeta = json_decode($request->request->get('inspections_meta', '[]'), true);
        $files = $request->files->get('files', []);

        $uploadedFilesMap = [];
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $partName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $uploadedFilesMap[$partName] = $file;
            }
        }

        if (empty($inspectionsMeta)) {
            return;
        }

        foreach ($inspectionsMeta as $inspectionData) {
            $part = $inspectionData['part'];
            if (isset($uploadedFilesMap[$part])) {
                $file = $uploadedFilesMap[$part];
                $fileType = $inspectionData['type'] ?? 'photo';

                $fileName = $this->fileUploader->upload($file, $fileType);

                $inspection = new Inspection();
                $inspection->setDeparturePass($departurePass);
                $inspection->setType($fileType);
                $inspection->setPart($part);
                $inspection->setMoment($moment);
                $inspection->setPhotoUrl($fileName);

                $departurePass->addInspection($inspection);
            }
        }
    }
}
