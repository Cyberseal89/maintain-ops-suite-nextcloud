<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * Junction record placing a Data Module into a Publication at a specific chapter/section/sequence.
 *
 * @method int     getPublicationId()    @method void setPublicationId(int $v)
 * @method int     getDocumentId()       @method void setDocumentId(int $v)
 * @method int     getChapter()          @method void setChapter(int $v)
 * @method int     getSection()          @method void setSection(int $v)
 * @method int     getSequence()         @method void setSequence(int $v)
 * @method ?string getChapterTitle()     @method void setChapterTitle(?string $v)
 */
class PublicationDm extends Entity implements \JsonSerializable {
    protected int     $publicationId = 0;
    protected int     $documentId    = 0;
    protected int     $chapter       = 1;
    protected int     $section       = 1;
    protected int     $sequence      = 10;
    protected ?string $chapterTitle  = null;

    public function jsonSerialize(): array {
        return [
            'id'             => $this->getId(),
            'publication_id' => $this->publicationId,
            'document_id'    => $this->documentId,
            'chapter'        => $this->chapter,
            'section'        => $this->section,
            'sequence'       => $this->sequence,
            'chapter_title'  => $this->chapterTitle,
        ];
    }
}
