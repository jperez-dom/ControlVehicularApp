<?php

namespace App\Controller\Api;

use App\Entity\Comission;
use App\Entity\Driver;
use App\Entity\Inspection;
use App\Entity\Pass;
use App\Entity\Place;
use App\Entity\Vehicle;
use App\Service\PdfGeneratorService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Annotation\Route;

class ComissionController extends AbstractController
{
    // --- MÉTODO PARA EL ENVÍO DE FICHA POR CORREO ---
    #[Route('/api/comissions/folio/{folio}/send', name: 'api_comission_send', methods: ['POST'])]
    public function send(
        string $folio,
        Request $request,
        EntityManagerInterface $em,
        PdfGeneratorService $pdf,
        MailerInterface $mailer
    ): JsonResponse {
        // 1. Obtener datos del frontend (el email de destino)
        $data = json_decode($request->getContent(), true);
        $emailDestino = $data['email'] ?? null;

        if (!$emailDestino || !filter_var($emailDestino, FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['success' => false, 'message' => 'El email de destino es obligatorio y debe ser válido.'], 400);
        }

        // 2. Buscar la Ficha
        $comission = $em->getRepository(Comission::class)->findOneBy(['folio' => $folio]);

        if (!$comission) {
            return new JsonResponse(['success' => false, 'message' => 'Ficha no encontrada con el folio proporcionado.'], 404);
        }

        // 3. Lógica de Envío
        try {
            // Recopilar todos los datos para el PDF
            $pass = $em->getRepository(Pass::class)->findOneBy(['comission' => $comission]);
            $destinos = $em->getRepository(Place::class)->findBy(['comission' => $comission]);

            // Datos de inspecciones (fotos y firmas)
            $photos = [];
            $signatures = ['driver' => null, 'approver' => null];
            if ($pass) {
                $inspections = $em->getRepository(Inspection::class)->findBy(['pass' => $pass], ['type' => 'ASC']); // Salida, luego Entrada
                foreach ($inspections as $inspection) {
                    if ($inspection->getPhotoUrl()) {
                        $photos[] = [
                            'label' => sprintf(
                                'Inspección de %s - %s',
                                ucfirst($inspection->getType()),
                                $inspection->getPart()
                            ),
                            'path' => $pdf->publicUrlToPath($inspection->getPhotoUrl()),
                        ];
                    }
                    // Las firmas se toman de la inspección de salida
                    if ($inspection->getType() === 'salida') {
                        if ($inspection->getSignatureConductor()) {
                            $signatures['driver'] = $pdf->publicUrlToPath($inspection->getSignatureConductor());
                        }
                        if ($inspection->getSignatureApprover()) {
                            $signatures['approver'] = $pdf->publicUrlToPath($inspection->getSignatureApprover());
                        }
                    }
                }
            }

            $passDetails = null;
            if ($pass) {
                $endDate = $pass->getEndDate();
                $passDetails = [
                    'startDate' => $pass->getStartDate(),
                    'endDate' => ($endDate && $endDate->format('Y') > 1970) ? $endDate : null,
                    'departureMileage' => $pass->getDepartureMileage(),
                    'arrivalMileage' => $pass->getArrivalMileage(),
                    'comment_salida' => $pass->getDepartureComment(),
                    'comment_entrada' => $pass->getArrivalComment(),
                ];
            }

            // Determinar estado de la comisión
            $statusText = 'Creada';
            if ($pass) {
                $statusText = 'Con Salida';
                if ($passDetails && $passDetails['endDate']) {
                    $statusText = 'Completada';
                }
            }

            // Datos para la plantilla Twig
            $dataForPdf = [
                'comission' => [
                    'folio' => $comission->getFolio(),
                    'driverName' => $comission->getDriver()?->getName(),
                    'vehicleName' => $comission->getVehicle() ? $comission->getVehicle()->getBrand() . ' ' . $comission->getVehicle()->getModel() : 'N/A',
                    'status' => $statusText,
                ],
                'pass' => $passDetails,
                'destinos' => array_map(fn($p) => [
                    'estado' => $p->getState(),
                    'ciudad' => $p->getCity(),
                    'comentario' => $p->getComment(),
                ], $destinos),
                'photos' => $photos,
                'signatures' => $signatures,
                'logoPath' => $pdf->publicUrlToPath('/img/logo-optimo.png'), // Asumiendo que el logo está aquí
            ];

            // Generar el PDF
            $pdfBinary = $pdf->renderToPdf($dataForPdf, 'pdf/comission_report.html.twig');

            // Enviar el correo
            $email = (new Email())
                ->from(new Address('no-reply@controlvehicular.com', 'Sistema Control Vehicular'))
                ->to($emailDestino)
                ->subject('Reporte de Comisión: ' . $comission->getFolio())
                ->text('Adjunto encontrarás el reporte de la comisión con folio ' . $comission->getFolio() . '.')
                ->attach($pdfBinary, sprintf('reporte-comision-%s.pdf', $comission->getFolio()), 'application/pdf');

            $mailer->send($email);

            return new JsonResponse([
                'success' => true,
                'message' => "Reporte de ficha {$folio} enviado exitosamente a {$emailDestino}.",
                'folio' => $folio
            ]);

        } catch (\Exception $e) {
            // Manejo de error si falla la generación del PDF o el envío del email
            return new JsonResponse([
                'success' => false,
                'message' => 'Error al procesar el envío del reporte: ' . $e->getMessage()
            ], 500);
        }
    }
    // --- FIN MÉTODO DE ENVÍO ---

    // Listar fichas con detalles para persistencia en frontend
    #[Route('/api/comissions', name: 'api_comission_list', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $comissions = $em->getRepository(Comission::class)->findBy(['status' => '1'], ['created_at' => 'DESC']);

        $data = [];
        foreach ($comissions as $comission) {
            // Find the associated Pass
            $pass = $em->getRepository(Pass::class)->findOneBy(['comission' => $comission]);

            // Determine the workflow state
            $estado = 'creada';
            $salidaData = null;
            $entradaData = null; // For UI consistency
            $passDetails = null;

            if ($pass) {
                // Default end date in the app logic is '1970-01-01'
                if ($pass->getEndDate() && $pass->getEndDate()->format('Y') > 1970) {
                    $estado = 'completada';
                    $entradaData = ['pass_id' => $pass->getId()]; // Simplified
                } else {
                    $estado = 'con-salida';
                }
                $salidaData = ['pass_id' => $pass->getId()];

                $inspections = $em->getRepository(Inspection::class)->findBy(['pass' => $pass]);
                $inspectionsData = array_map(fn($i) => [
                    'id' => $i->getId(),
                    'type' => $i->getType(),
                    'part' => $i->getPart(),
                    'comment' => $i->getComment(),
                    'photo_url' => $i->getPhotoUrl(),
                    'signature_conductor_url' => $i->getSignatureConductor(),
                    'signature_approver_url' => $i->getSignatureApprover(),
                ], $inspections);

                $passDetails = [
                    'id' => $pass->getId(),
                    'departureMileage' => $pass->getDepartureMileage(),
                    'arrivalMileage' => $pass->getArrivalMileage(),
                    'fuel' => $pass->getFuel(),
                    'comment_salida' => $pass->getDepartureComment(),
                    'comment_entrada' => $pass->getArrivalComment(),
                    'startDate' => $pass->getStartDate()?->format('Y-m-d H:i:s'),
                    'endDate' => $pass->getEndDate()?->format('Y-m-d H:i:s'),
                    'status' => $pass->getStatus(),
                    'comission_folio' => $comission->getFolio(),
                    'inspections' => $inspectionsData,
                ];
            }

            // Find associated destinations (Places)
            $places = $em->getRepository(Place::class)->findBy(['comission' => $comission]);
            $destinos = array_map(fn($p) => [
                'id' => (string)$p->getId(),
                'estado' => $p->getState(),
                'ciudad' => $p->getCity(),
                'comentario' => $p->getComment(),
            ], $places);

            // Vehicle value format to match frontend's format
            $vehicle = $comission->getVehicle();
            $vehicleValue = '';
            if ($vehicle) {
                $vehicleValue = strtolower($vehicle->getBrand() . '-' . $vehicle->getModel());
                $vehicleValue = preg_replace('/\s+/', '-', $vehicleValue);
            }

            $data[] = [
                'id' => $comission->getId(),
                'folio' => (string)$comission->getFolio(),
                'conductorNombre' => $comission->getDriver()?->getName(),
                'conductorCargo' => $comission->getDriver()?->getPosition(),
                'vehiculo' => $vehicleValue, // The value 'toyota-hilux'
                'destinos' => $destinos,
                'fechaCreacion' => $comission->getCreatedAt()?->format('Y-m-d H:i:s'),
                'estado' => $estado,
                'salidaData' => $salidaData,
                'entradaData' => $entradaData, // To know if entry is complete
                'passDetails' => $passDetails,
            ];
        }

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

    #[Route('/api/comissions/folio/{folio}/pass', name: 'api_comission_pass_update', methods: ['PUT'])]
    public function updatePass(Request $request, EntityManagerInterface $em, string $folio): JsonResponse
    {
        $comission = $em->getRepository(Comission::class)->findOneBy(['folio' => $folio]);

        if (!$comission) {
            return new JsonResponse(['success' => false, 'message' => 'Ficha no encontrada.'], 404);
        }

        $pass = $em->getRepository(Pass::class)->findOneBy(['comission' => $comission]);

        if (!$pass) {
            return new JsonResponse(['success' => false, 'message' => 'Pase de salida/entrada no encontrado para esta ficha.'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (array_key_exists('departureMileage', $data)) {
            $pass->setDepartureMileage($data['departureMileage']);
        }
        if (array_key_exists('arrivalMileage', $data)) {
            $pass->setArrivalMileage($data['arrivalMileage']);
        }
        if (array_key_exists('departureComment', $data)) {
            $pass->setDepartureComment($data['departureComment']);
        }
        if (array_key_exists('arrivalComment', $data)) {
            $pass->setArrivalComment($data['arrivalComment']);
        }
        if (array_key_exists('fuel', $data)) {
            $pass->setFuel($data['fuel']);
        }

        $em->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Pase actualizado correctamente.'
        ]);
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
