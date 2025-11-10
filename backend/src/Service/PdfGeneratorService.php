<?php
namespace App\Service;

use Dompdf\Dompdf;
use Dompdf\Options;
use Twig\Environment as Twig;

class PdfGeneratorService
{
    public function __construct(
        private Twig $twig,
        private string $projectDir, // %kernel.project_dir%
        private string $reportsDirectory
    ) {}

    /**
     * Renderiza el Twig a PDF y regresa el binario.
     * @param array $data Variables para la plantilla
     * @param string $template Ruta twig relativa (e.g. 'pdf/comission_report.html.twig')
     */
    public function renderToPdf(array $data, string $template = 'pdf/comission_report.html.twig'): string
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('chroot', $this->projectDir . '/public');

        $dompdf = new Dompdf($options);
        $html = $this->twig->render($template, $data);

        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    /**
     * Renderiza el Twig a PDF, lo guarda en el servidor y devuelve la ruta del archivo.
     */
    public function renderAndSavePdf(string $filename, array $data, string $template = 'pdf/comission_report.html.twig'): string
    {
        $pdfBinary = $this->renderToPdf($data, $template);
        $filePath = $this->reportsDirectory . '/' . $filename;

        if (!is_dir($this->reportsDirectory)) {
            mkdir($this->reportsDirectory, 0777, true);
        }

        file_put_contents($filePath, $pdfBinary);

        return $filePath;
    }

    /** Convierte una URL pública (/uploads/...) a ruta absoluta en disco para Dompdf */
    public function publicUrlToPath(?string $url): ?string
    {
        if (!$url) return null;
        $clean = preg_replace('#^https?://[^/]+#', '', $url);
        if ($clean && $clean[0] !== '/') $clean = '/'.$clean;
        return $this->projectDir . '/public' . $clean;
    }
}
