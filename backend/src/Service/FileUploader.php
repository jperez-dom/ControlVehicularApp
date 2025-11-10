<?php

// src/Service/FileUploader.php
namespace App\Service;

use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;

class FileUploader
{
    private SluggerInterface $slugger;
    private array $targetDirectories;

    public function __construct(SluggerInterface $slugger, array $targetDirectories)
    {
        $this->slugger = $slugger;
        $this->targetDirectories = $targetDirectories;
    }

    public function upload(UploadedFile $file, string $tipoDocumento): string
    {
        $targetDirectory = $this->targetDirectories[$tipoDocumento] ?? null;
        if (!$targetDirectory) {
            throw new \InvalidArgumentException(sprintf('El tipo de documento "%s" no es válido. Tipos válidos: %s', $tipoDocumento, implode(', ', array_keys($this->targetDirectories))));
        }

        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $this->slugger->slug($originalFilename);
        $fileName = $safeFilename.'-'.uniqid().'.'.$file->guessExtension();

        try {
            $file->move($targetDirectory, $fileName);
        } catch (FileException $e) {
            throw new FileException('No se pudo mover el archivo subido.', 0, $e);
        }

        return $fileName;
    }
}
