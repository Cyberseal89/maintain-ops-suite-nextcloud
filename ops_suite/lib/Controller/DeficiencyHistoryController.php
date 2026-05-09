<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\DeficiencyHistory;
use OCA\OpsSuite\Db\DeficiencyHistoryMapper;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class DeficiencyHistoryController extends Controller {
    public function __construct(
        string       $appName,
        IRequest     $request,
        private readonly DeficiencyHistoryMapper $mapper,
        private readonly IUserSession            $userSession
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @NoAdminRequired
     * Append a troubleshooting note to a deficiency.
     */
    public function create(int $deficiencyId): DataResponse {
        $uid  = $this->userSession->getUser()?->getUID() ?? '';
        $data = $this->request->getParams();

        // Accept 'entry_text' or 'entry' from the request body
        $text = $data['entry_text'] ?? $data['entry'] ?? '';
        if (trim($text) === '') {
            return new DataResponse(['message' => 'entry_text is required'], Http::STATUS_BAD_REQUEST);
        }

        $entry = new DeficiencyHistory();
        $entry->setDeficiencyId($deficiencyId);
        $entry->setEntryText($text);
        $entry->setCreatedBy($uid);
        $entry->setCreatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->mapper->insert($entry)->jsonSerialize(), Http::STATUS_CREATED);
    }
}
