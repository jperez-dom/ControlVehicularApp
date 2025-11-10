<?php

namespace App\Controller\Api;

use App\Entity\Comission;
use App\Entity\DeparturePass;
use App\Entity\ArrivalPass;
use App\Entity\Place;
use App\Entity\Driver;
use App\Entity\Vehicle;
use App\Entity\Users;
use App\Service\PdfGeneratorService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ComissionController extends AbstractController
{
    #[Route('/api/comissions/folio/{folio}/download-pdf', name: 'api_comission_download_pdf', methods: ['GET'])]
    public function downloadPdf(string $folio, EntityManagerInterface $em, PdfGeneratorService $pdf): Response
    {
        $comission = $em->getRepository(Comission::class)->findOneBy(['folio' => $folio]);
        if (!$comission) {
            return new JsonResponse(['success' => false, 'message' => 'Ficha no encontrada.'], 404);
        }

        try {
            $departurePass = $em->getRepository(DeparturePass::class)->findOneBy(['comission' => $comission]);
            $arrivalPass = $departurePass ? $em->getRepository(ArrivalPass::class)->findOneBy(['departurePass' => $departurePass]) : null;

            $photos = ['departure' => [], 'arrival' => []];
            $signatures = ['driver_departure' => null, 'approver_departure' => null, 'driver_arrival' => null, 'approver_arrival' => null];
            $passDetails = [];

            $basePartDescriptions = [
                'mileage' => 'Odómetro', 'front' => 'Frontal', 'right_side' => 'Lateral Derecho',
                'left_side' => 'Lateral Izquierdo', 'back' => 'Posterior', 'interior' => 'Interior',
            ];

            $signaturePartToTemplateKeyMap = [
                'conductor_salida' => 'driver_departure',
                'approver_salida' => 'approver_departure',
                'conductor_entrada_entry' => 'driver_arrival',
                'approver_entrada_entry' => 'approver_arrival',
            ];

            if ($departurePass) {
                $passDetails = [
                    'id' => $departurePass->getId(),
                    'startDate' => $departurePass->getStartDate(),
                    'endDate' => $arrivalPass?->getEndDate(),
                    'departureMileage' => $departurePass->getDepartureMileage(),
                    'arrivalMileage' => $arrivalPass?->getArrivalMileage(),
                    'departureFuel' => $departurePass->getDepartureFuel(),
                    'arrivalFuel' => $arrivalPass?->getArrivalFuel(),
                    'comment_salida' => $departurePass->getDepartureComment(),
                    'comment_entrada' => $arrivalPass?->getArrivalComment(),
                ];

                foreach ($departurePass->getInspections() as $inspection) {
                    $fileName = $inspection->getPhotoUrl();
                    if (!$fileName) continue;

                    $moment = $inspection->getMoment();
                    $publicUrl = sprintf("/uploads/%ss/%s", $inspection->getType(), $fileName);

                    if ($inspection->getType() === 'photo') {
                        $label = $basePartDescriptions[$inspection->getPart()] ?? ucfirst(str_replace('_', ' ', $inspection->getPart()));
                        if ($moment === 'departure') {
                            $photos['salida'][] = ['label' => $label, 'path' => $pdf->publicUrlToPath($publicUrl)];
                        } elseif ($moment === 'arrival') {
                            $photos['entrada'][] = ['label' => $label, 'path' => $pdf->publicUrlToPath($publicUrl)];
                        }
                    } elseif ($inspection->getType() === 'signature') {
                        $part = $inspection->getPart();
                        if (isset($signaturePartToTemplateKeyMap[$part])) {
                            $templateKey = $signaturePartToTemplateKeyMap[$part];
                            $signatures[$templateKey] = $pdf->publicUrlToPath($publicUrl);
                        }
                    }
                }
            }

            $statusText = 'Creada';
            if ($departurePass) {
                $statusText = $arrivalPass ? 'Completada' : 'Con Salida';
            }

            $dataForPdf = [
                'comission' => [
                    'folio' => $comission->getFolio(),
                    'driverName' => $comission->getDriver()?->getName(),
                    'driverPosition' => $comission->getDriver()?->getPosition(),
                    'vehicleName' => $comission->getVehicle() ? $comission->getVehicle()->getBrand() . ' ' . $comission->getVehicle()->getModel() : 'N/A',
                    'vehiclePlate' => $comission->getVehicle()?->getPlate(),
                    'status' => $statusText,
                    'approverName' => $comission->getUser()?->getUser(),
                ],
                'pass' => $passDetails,
                'destinos' => array_map(fn($p) => ['estado' => $p->getState(), 'ciudad' => $p->getCity(), 'comentario' => $p->getComment()], $comission->getPlaces()->toArray()),
                'photos' => $photos,
                'signatures' => $signatures,
                'logoPath' => $pdf->publicUrlToPath('/uploads/logo.png'),
            ];

            $pdfFileName = sprintf('reporte-comision-%s.pdf', $comission->getFolio());
            $pdfPath = $pdf->renderAndSavePdf($pdfFileName, $dataForPdf, 'pdf/comission_report.html.twig');

            return new Response(file_get_contents($pdfPath), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => sprintf('attachment; filename="%s"', $pdfFileName),
            ]);

        } catch (\Exception $e) {
            return new JsonResponse(['success' => false, 'message' => 'Error al generar el PDF: ' . $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
        }
    }

    #[Route('/api/comissions', name: 'api_comission_list', methods: ['GET'])]
    public function list(EntityManagerInterface $em, Request $request): JsonResponse
    {
        $comissions = $em->getRepository(Comission::class)->findBy(['status' => '1'], ['created_at' => 'DESC']);
        $baseUrl = $request->getSchemeAndHttpHost();
        $data = [];

        foreach ($comissions as $comission) {
            $departurePass = $em->getRepository(DeparturePass::class)->findOneBy(['comission' => $comission]);
            $arrivalPass = null;
            $passDetails = null;

            if ($departurePass) {
                $arrivalPass = $em->getRepository(ArrivalPass::class)->findOneBy(['departurePass' => $departurePass]);
                $inspectionsData = [];
                foreach ($departurePass->getInspections() as $i) {
                    $fileName = $i->getPhotoUrl();
                    if (!$fileName) continue;
                    $publicUrl = sprintf("/uploads/%ss/%s", $i->getType(), $fileName);
                    $inspectionsData[] = [
                        'id' => $i->getId(), 'type' => $i->getType(), 'part' => $i->getPart(),
                        'moment' => $i->getMoment(), 'photo_url' => $baseUrl . $publicUrl,
                    ];
                }

                $passDetails = [
                    'id' => $departurePass->getId(),
                    'startDate' => $departurePass->getStartDate()?->format('Y-m-d H:i:s'),
                    'endDate' => $arrivalPass?->getEndDate()?->format('Y-m-d H:i:s'),
                    'departureMileage' => $departurePass->getDepartureMileage(),
                    'arrivalMileage' => $arrivalPass?->getArrivalMileage(),
                    'departureFuel' => $departurePass->getDepartureFuel(),
                    'arrivalFuel' => $arrivalPass?->getArrivalFuel(),
                    'comment_salida' => $departurePass->getDepartureComment(),
                    'comment_entrada' => $arrivalPass?->getArrivalComment(),
                    'inspections' => $inspectionsData,
                ];
            }

            $data[] = [
                'id' => $comission->getId(),
                'folio' => (string)$comission->getFolio(),
                'conductorNombre' => $comission->getDriver()?->getName(),
                'conductorCargo' => $comission->getDriver()?->getPosition(),
                'vehiculo' => $comission->getVehicle() ? $comission->getVehicle()->getBrand() . ' ' . $comission->getVehicle()->getModel() : null,
                'destinos' => array_map(fn($p) => ['id' => (string)$p->getId(), 'estado' => $p->getState(), 'ciudad' => $p->getCity(), 'comentario' => $p->getComment()], $comission->getPlaces()->toArray()),
                'fechaCreacion' => $comission->getCreatedAt()?->format('Y-m-d H:i:s'),
                'estado' => $arrivalPass ? 'completada' : ($departurePass ? 'con-salida' : 'creada'),
                'passDetails' => $passDetails,
            ];
        }

        return new JsonResponse($data);
    }

    #[Route('/api/comissions', name: 'api_comission_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['driver_id']) || !isset($data['vehicle_id']) || !isset($data['user_id'])) {
            return new JsonResponse(['success' => false, 'message' => 'Conductor, vehículo y usuario son obligatorios'], 400);
        }

        $driver = $em->getRepository(Driver::class)->find($data['driver_id']);
        $vehicle = $em->getRepository(Vehicle::class)->find($data['vehicle_id']);
        $user = $em->getRepository(Users::class)->find($data['user_id']);

        if (!$driver || !$vehicle || !$user) {
            return new JsonResponse(['success' => false, 'message' => 'Conductor, vehículo o usuario no encontrado'], 404);
        }

        try {
            $comission = new Comission();
            $comission->setFolio(date('ymd') . str_pad((string)rand(1, 999), 3, '0', STR_PAD_LEFT));
            $comission->setDriver($driver);
            $comission->setVehicle($vehicle);
            $comission->setUser($user);
            $comission->setDate(new \DateTime());
            $comission->setCity($data['city'] ?? 'Por definir');
            $comission->setState($data['state'] ?? 'Por definir');
            $comission->setDescription($data['description'] ?? null);
            $comission->setStatus('1');
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
                ]
            ], 201);
        } catch (\Exception $e) {
            return new JsonResponse(['success' => false, 'message' => 'Error al crear la ficha: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/api/comissions/folio/{folio}', name: 'delete_comission_by_folio', methods: ['DELETE'])]
    public function deleteByFolio(string $folio, EntityManagerInterface $em): JsonResponse
    {
        try {
            $comission = $em->getRepository(Comission::class)->findOneBy(['folio' => $folio]);
            if (!$comission) return new JsonResponse(['success' => false, 'message' => 'Ficha no encontrada.'], 404);

            $comission->setStatus('0');
            $em->flush();

            return new JsonResponse(['success' => true, 'message' => "Ficha con folio {$folio} marcada como eliminada (status = 0)."]);
        } catch (\Exception $e) {
            return new JsonResponse(['success' => false, 'message' => 'Error al intentar marcar la ficha como eliminada: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/api/comissions/folio/{folio}/restore', name: 'restore_comission_by_folio', methods: ['PATCH'])]
    public function restoreByFolio(string $folio, EntityManagerInterface $em): JsonResponse
    {
        $comission = $em->getRepository(Comission::class)->findOneBy(['folio' => $folio]);
        if (!$comission) return new JsonResponse(['success' => false, 'message' => 'Ficha no encontrada.'], 404);

        if ($comission->getStatus() === '1') return new JsonResponse(['success' => false, 'message' => 'La ficha ya está activa.']);

        $comission->setStatus('1');
        $em->flush();

        return new JsonResponse([
            'success' => true,
            'message' => "Ficha con folio {$folio} restaurada correctamente (status = 1)."
        ]);
    }
}
