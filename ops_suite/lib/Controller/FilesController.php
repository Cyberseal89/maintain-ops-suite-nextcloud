<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\Http;
use OCP\Files\IRootFolder;
use OCP\Files\FileInfo;
use OCP\IRequest;
use OCP\IUserSession;

class FilesController extends Controller {
    public const SOP_FOLDER = 'PMS Procedures';

    public function __construct(
        string               $appName,
        IRequest             $request,
        private readonly IRootFolder   $rootFolder,
        private readonly IUserSession  $userSession
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @NoAdminRequired
     * Returns info about the SOP folder, creating it if it doesn't exist.
     */
    public function sopFolder(): DataResponse {
        $uid = $this->userSession->getUser()?->getUID();
        if (!$uid) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }

        try {
            $userFolder = $this->rootFolder->getUserFolder($uid);

            // Create PMS Procedures folder if it doesn't exist
            if (!$userFolder->nodeExists(self::SOP_FOLDER)) {
                $userFolder->newFolder(self::SOP_FOLDER);
            }

            $folder = $userFolder->get(self::SOP_FOLDER);
            return new DataResponse([
                'path'  => '/' . self::SOP_FOLDER,
                'name'  => self::SOP_FOLDER,
                'files' => $this->listFiles($folder),
            ]);
        } catch (\Exception $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @NoAdminRequired
     * Lists files in a given path (defaults to PMS Procedures).
     */
    public function listFolder(): DataResponse {
        $uid  = $this->userSession->getUser()?->getUID();
        $path = $this->request->getParam('path', self::SOP_FOLDER);

        if (!$uid) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }

        // Strip leading slash
        $path = ltrim($path, '/');

        try {
            $userFolder = $this->rootFolder->getUserFolder($uid);
            if (!$userFolder->nodeExists($path)) {
                return new DataResponse(['error' => 'Path not found'], Http::STATUS_NOT_FOUND);
            }
            $folder = $userFolder->get($path);
            if ($folder->getType() !== FileInfo::TYPE_FOLDER) {
                return new DataResponse(['error' => 'Not a folder'], Http::STATUS_BAD_REQUEST);
            }
            return new DataResponse([
                'path'  => '/' . $path,
                'files' => $this->listFiles($folder),
            ]);
        } catch (\Exception $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @NoAdminRequired
     * Returns the direct Nextcloud Files URL to open a file in the viewer.
     */
    public function openUrl(): DataResponse {
        $path = $this->request->getParam('path', '');
        if (!$path) {
            return new DataResponse(['error' => 'path required'], Http::STATUS_BAD_REQUEST);
        }
        // Return the NC files URL — frontend opens it in a new tab
        return new DataResponse([
            'url' => '/apps/files/?dir=' . urlencode(dirname($path))
                   . '&openfile=' . urlencode(basename($path)),
        ]);
    }

    /**
     * @NoAdminRequired
     * Gets TDP folder contents for an asset.
     */
    public function getTdpContents(): DataResponse {
        $uid       = $this->userSession->getUser()?->getUID();
        $assetId   = $this->request->getParam('asset_id');
        $assetName = $this->request->getParam('asset_name', 'Asset');

        if (!$uid) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }

        $folderName = 'TDP/' . $assetId . ' — ' . preg_replace('/[^\w\s\-]/', '', $assetName);
        $subFolders = ['Drawings', 'Tech Manuals', 'Test Plans', 'Training', 'PM SOPs', 'Other'];

        try {
            $userFolder = $this->rootFolder->getUserFolder($uid);
            $result = [];

            foreach ($subFolders as $sub) {
                $subPath = $folderName . '/' . $sub;
                $files = [];
                if ($userFolder->nodeExists($subPath)) {
                    $folder = $userFolder->get($subPath);
                    $files = $this->listFiles($folder);
                }
                $result[] = [
                    'name'  => $sub,
                    'path'  => '/' . $subPath,
                    'url'   => '/apps/files/?dir=' . urlencode('/' . $subPath),
                    'files' => $files,
                ];
            }

            return new DataResponse([
                'folder' => '/' . $folderName,
                'url'    => '/apps/files/?dir=' . urlencode('/' . $folderName),
                'sections' => $result,
            ]);
        } catch (\Exception $e) {
            return new DataResponse(['sections' => [], 'error' => $e->getMessage()]);
        }
    }

    /**
     * @NoAdminRequired
     * Creates TDP folder structure for an asset.
     */
    public function createTdpFolder(): DataResponse {
        $uid      = $this->userSession->getUser()?->getUID();
        $assetId  = $this->request->getParam('asset_id');
        $assetName = $this->request->getParam('asset_name', 'Asset');

        if (!$uid) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }

        $folderName = 'TDP/' . $assetId . ' — ' . preg_replace('/[^\w\s\-]/', '', $assetName);
        $subFolders = ['Drawings', 'Tech Manuals', 'Test Plans', 'Training', 'PM SOPs', 'Other'];

        try {
            $userFolder = $this->rootFolder->getUserFolder($uid);

            // Create TDP root
            if (!$userFolder->nodeExists('TDP')) {
                $userFolder->newFolder('TDP');
            }

            // Create asset folder
            if (!$userFolder->nodeExists($folderName)) {
                $userFolder->newFolder($folderName);
            }

            // Create subfolders
            foreach ($subFolders as $sub) {
                $subPath = $folderName . '/' . $sub;
                if (!$userFolder->nodeExists($subPath)) {
                    $userFolder->newFolder($subPath);
                }
            }

            return new DataResponse([
                'path'   => '/' . $folderName,
                'url'    => '/apps/files/?dir=' . urlencode('/' . $folderName),
                'folders'=> $subFolders,
            ]);
        } catch (\Exception $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_INTERNAL_SERVER_ERROR);
        }
    }

    private function listFiles(\OCP\Files\Folder $folder): array {
        $items = [];
        foreach ($folder->getDirectoryListing() as $node) {
            $items[] = [
                'name'  => $node->getName(),
                'path'  => $node->getPath(),
                // Strip /uid/files prefix to get the user-relative path
                'rel'   => preg_replace('#^/[^/]+/files#', '', $node->getPath()),
                'type'  => $node->getType() === FileInfo::TYPE_FOLDER ? 'folder' : 'file',
                'mime'  => $node->getType() === FileInfo::TYPE_FOLDER ? 'folder' : $node->getMimetype(),
                'mtime' => $node->getMTime(),
                'size'  => $node->getSize(),
            ];
        }
        // Folders first, then files, both alphabetical
        usort($items, function($a, $b) {
            if ($a['type'] !== $b['type']) return $a['type'] === 'folder' ? -1 : 1;
            return strcasecmp($a['name'], $b['name']);
        });
        return $items;
    }
}
