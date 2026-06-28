<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;
use OCP\IURLGenerator;

class PageController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private readonly IURLGenerator $urlGenerator,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function index(): TemplateResponse {
        return new TemplateResponse('ops_suite', 'index');
    }

    /**
     * Serve the service worker with correct scope header.
     * @NoAdminRequired
     * @NoCSRFRequired
     * @PublicPage
     */
    public function swJs(): Response {
        $swPath = __DIR__ . '/../../js/sw.js';
        $content = file_exists($swPath) ? file_get_contents($swPath) : '/* SW not found */';
        $appBase = $this->urlGenerator->linkTo('ops_suite', '');
        $response = new class($content, $appBase) extends Response {
            public function __construct(private string $body, string $scope) {
                parent::__construct();
                $this->addHeader('Content-Type', 'application/javascript; charset=utf-8');
                $this->addHeader('Service-Worker-Allowed', $scope);
                $this->addHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            }
            public function render(): string { return $this->body; }
        };
        return $response;
    }

    /**
     * PWA Web App Manifest.
     * @NoAdminRequired
     * @NoCSRFRequired
     * @PublicPage
     */
    public function manifest(): JSONResponse {
        $base = rtrim($this->urlGenerator->linkTo('ops_suite', ''), '/') . '/';
        $abs  = $this->urlGenerator->getAbsoluteURL($base);
        return new JSONResponse([
            'name'             => 'Maintain Ops Suite',
            'short_name'       => 'MOS',
            'description'      => 'Operations management — assets, PM, deficiencies, fleet',
            'start_url'        => $abs,
            'scope'            => $abs,
            'display'          => 'standalone',
            'background_color' => '#0f172a',
            'theme_color'      => '#1e293b',
            'icons'            => [
                ['src' => $abs . 'img/app.svg', 'sizes' => 'any', 'type' => 'image/svg+xml'],
            ],
        ]);
    }

    /** @NoAdminRequired */
    public function manual(): \OCP\AppFramework\Http\DataResponse {
        $manualPath = __DIR__ . '/../../USER_MANUAL.md';
        if (!file_exists($manualPath)) {
            return new \OCP\AppFramework\Http\DataResponse(['html' => '<p>Manual not found.</p>']);
        }
        $md = file_get_contents($manualPath);
        // Simple markdown to HTML conversion
        $html = $md;
        // Headers
        $html = preg_replace('/^### (.+)$/m', '<h3>$1</h3>', $html);
        $html = preg_replace('/^## (.+)$/m', '<h2>$1</h2>', $html);
        $html = preg_replace('/^# (.+)$/m', '<h1>$1</h1>', $html);
        // Bold
        $html = preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', $html);
        // Code
        $html = preg_replace('/`(.+?)`/', '<code>$1</code>', $html);
        // Tables - basic
        $lines = explode("
", $html);
        $out = []; $inTable = false;
        foreach ($lines as $line) {
            if (preg_match('/^\|/', $line)) {
                if (!$inTable) { $out[] = '<table>'; $inTable = true; }
                if (preg_match('/^\|[-| ]+\|$/', $line)) continue; // separator
                $cells = array_slice(explode('|', $line), 1, -1);
                $tag = count($out) === 1 || (count($out) > 1 && str_contains($out[count($out)-1]??'', '<table>')) ? 'th' : 'td';
                $row = '<tr>' . implode('', array_map(fn($c) => "<$tag>".trim($c)."</$tag>", $cells)) . '</tr>';
                $out[] = $row;
            } else {
                if ($inTable) { $out[] = '</table>'; $inTable = false; }
                // Lists
                if (preg_match('/^- (.+)$/', $line, $m)) {
                    $out[] = '<li>' . $m[1] . '</li>';
                } elseif (preg_match('/^\d+\. (.+)$/', $line, $m)) {
                    $out[] = '<li>' . $m[1] . '</li>';
                } elseif (trim($line) === '---') {
                    $out[] = '<hr style="border-color:#2e3650;margin:24px 0;">';
                } elseif (trim($line) === '') {
                    $out[] = '<br>';
                } else {
                    $out[] = '<p>' . $line . '</p>';
                }
            }
        }
        if ($inTable) $out[] = '</table>';
        return new \OCP\AppFramework\Http\DataResponse(['html' => implode("
", $out)]);
    }
}