<?php

namespace App\Controller;

use App\Entity\Inspection;
use App\Form\InspectionType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Service\FileUploader;

final class TestController extends AbstractController
{
    #[Route('/test', name: 'app_test')]
    public function index(Request $request, FileUploader $fileUploader): Response
    {
        $inspection = new Inspection();
        $form = $this->createForm(InspectionType::class, $inspection);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            /** @var UploadedFile|null $photoFile */
            $photoFile = $form->get('photo_url')->getData();


            if ($photoFile) {

                $tipoDocumento = 'photo';
                $newFilename = $fileUploader->upload($photoFile, $tipoDocumento);

                $this->addFlash('success', '¡Archivo subido con éxito! Nombre: ' . $newFilename);
            }
        }

        return $this->render('test/index.html.twig', [
            'form' => $form,
        ]);
    }
}
