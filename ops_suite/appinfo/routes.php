<?php
declare(strict_types=1);
return [
    'routes' => [
        // ── Page ──────────────────────────────────────────────────
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],

        // ── MMBP Budget ───────────────────────────────────────────
        ['name' => 'mmbp_budget#index',   'url' => '/api/budget',         'verb' => 'GET'],
        ['name' => 'mmbp_budget#show',    'url' => '/api/budget/{id}',    'verb' => 'GET'],
        ['name' => 'mmbp_budget#create',  'url' => '/api/budget',         'verb' => 'POST'],
        ['name' => 'mmbp_budget#update',  'url' => '/api/budget/{id}',    'verb' => 'PUT'],
        ['name' => 'mmbp_budget#destroy', 'url' => '/api/budget/{id}',    'verb' => 'DELETE'],
        ['name' => 'mmbp_budget#summary', 'url' => '/api/budget/summary', 'verb' => 'GET'],

        // ── Shops ─────────────────────────────────────────────────
        ['name' => 'shop#index',   'url' => '/api/shops',      'verb' => 'GET'],
        ['name' => 'shop#show',    'url' => '/api/shops/{id}', 'verb' => 'GET'],
        ['name' => 'shop#create',  'url' => '/api/shops',      'verb' => 'POST'],
        ['name' => 'shop#update',  'url' => '/api/shops/{id}', 'verb' => 'PUT'],
        ['name' => 'shop#destroy', 'url' => '/api/shops/{id}', 'verb' => 'DELETE'],

        // ── Assets ────────────────────────────────────────────────
        ['name' => 'asset#index',          'url' => '/api/assets',                   'verb' => 'GET'],
        ['name' => 'asset#show',           'url' => '/api/assets/{id}',              'verb' => 'GET'],
        ['name' => 'asset#create',         'url' => '/api/assets',                   'verb' => 'POST'],
        ['name' => 'asset#update',         'url' => '/api/assets/{id}',              'verb' => 'PUT'],
        ['name' => 'asset#destroy',        'url' => '/api/assets/{id}',              'verb' => 'DELETE'],
        ['name' => 'asset#readiness',      'url' => '/api/assets/{id}/readiness',    'verb' => 'GET'],
        ['name' => 'asset#set_criticality','url' => '/api/assets/{id}/criticality',  'verb' => 'PUT'],

        // ── Procedures ────────────────────────────────────────────
        ['name' => 'procedure#index',    'url' => '/api/procedures',               'verb' => 'GET'],
        ['name' => 'procedure#show',     'url' => '/api/procedures/{id}',          'verb' => 'GET'],
        ['name' => 'procedure#create',   'url' => '/api/procedures',               'verb' => 'POST'],
        ['name' => 'procedure#update',   'url' => '/api/procedures/{id}',          'verb' => 'PUT'],
        ['name' => 'procedure#complete', 'url' => '/api/procedures/{id}/complete', 'verb' => 'POST'],
        ['name' => 'procedure#destroy',  'url' => '/api/procedures/{id}',          'verb' => 'DELETE'],

        // ── Deficiencies ──────────────────────────────────────────
        ['name' => 'deficiency#index',   'url' => '/api/deficiencies',      'verb' => 'GET'],
        ['name' => 'deficiency#show',    'url' => '/api/deficiencies/{id}', 'verb' => 'GET'],
        ['name' => 'deficiency#create',  'url' => '/api/deficiencies',      'verb' => 'POST'],
        ['name' => 'deficiency#update',  'url' => '/api/deficiencies/{id}', 'verb' => 'PUT'],
        ['name' => 'deficiency#destroy', 'url' => '/api/deficiencies/{id}', 'verb' => 'DELETE'],

        // ── Deficiency History ────────────────────────────────────
        ['name' => 'deficiency_history#create',
         'url'  => '/api/deficiencies/{deficiencyId}/history',
         'verb' => 'POST'],

        // ── Dashboard ─────────────────────────────────────────────
        ['name' => 'dashboard#stats',   'url' => '/api/dashboard/stats',   'verb' => 'GET'],
        ['name' => 'dashboard#myStats', 'url' => '/api/dashboard/mystats', 'verb' => 'GET'],

        // ── Users ─────────────────────────────────────────────────
        ['name' => 'user#index', 'url' => '/api/users', 'verb' => 'GET'],

        // ── Groups ────────────────────────────────────────────────
        ['name' => 'user#groups', 'url' => '/api/groups', 'verb' => 'GET'],

        // ── Settings ──────────────────────────────────────────────
        ['name' => 'settings#get',  'url' => '/api/settings',      'verb' => 'GET'],
        ['name' => 'settings#me',   'url' => '/api/settings/me',   'verb' => 'GET'],
        ['name' => 'settings#save', 'url' => '/api/settings',      'verb' => 'POST'],
        ['name' => 'settings#seed', 'url' => '/api/settings/seed', 'verb' => 'POST'],

        ['name' => 'page#manual',  'url' => '/user-manual', 'verb' => 'GET'],

        // ── Supply / Warehouse ────────────────────────────────────
        ['name' => 'supply#indexRequests',     'url' => '/api/supply/requests',                          'verb' => 'GET'],
        ['name' => 'supply#showRequest',       'url' => '/api/supply/requests/{id}',                     'verb' => 'GET'],
        ['name' => 'supply#createRequest',     'url' => '/api/supply/requests',                          'verb' => 'POST'],
        ['name' => 'supply#updateRequest',     'url' => '/api/supply/requests/{id}',                     'verb' => 'PUT'],
        ['name' => 'supply#destroyRequest',    'url' => '/api/supply/requests/{id}',                     'verb' => 'DELETE'],
        ['name' => 'supply#addRequestItem',    'url' => '/api/supply/requests/{id}/items',               'verb' => 'POST'],
        ['name' => 'supply#updateRequestItem', 'url' => '/api/supply/requests/{id}/items/{itemId}',      'verb' => 'PUT'],
        ['name' => 'supply#deleteRequestItem', 'url' => '/api/supply/requests/{id}/items/{itemId}',      'verb' => 'DELETE'],
        ['name' => 'supply#indexInventory',    'url' => '/api/supply/inventory',                         'verb' => 'GET'],
        ['name' => 'supply#showInventory',     'url' => '/api/supply/inventory/{id}',                    'verb' => 'GET'],
        ['name' => 'supply#createInventory',   'url' => '/api/supply/inventory',                         'verb' => 'POST'],
        ['name' => 'supply#updateInventory',   'url' => '/api/supply/inventory/{id}',                    'verb' => 'PUT'],
        ['name' => 'supply#transactInventory', 'url' => '/api/supply/inventory/{id}/transact',           'verb' => 'POST'],

        // ── Work Packages ─────────────────────────────────────────
        ['name' => 'workPackage#index',        'url' => '/api/work-packages',                            'verb' => 'GET'],
        ['name' => 'workPackage#show',         'url' => '/api/work-packages/{id}',                       'verb' => 'GET'],
        ['name' => 'workPackage#create',       'url' => '/api/work-packages',                            'verb' => 'POST'],
        ['name' => 'workPackage#update',       'url' => '/api/work-packages/{id}',                       'verb' => 'PUT'],
        ['name' => 'workPackage#destroy',      'url' => '/api/work-packages/{id}',                       'verb' => 'DELETE'],
        ['name' => 'workPackage#addItem',      'url' => '/api/work-packages/{id}/items',                 'verb' => 'POST'],
        ['name' => 'workPackage#removeItem',   'url' => '/api/work-packages/{id}/items/{itemId}',        'verb' => 'DELETE'],
        ['name' => 'workPackage#indexQuotes',  'url' => '/api/work-packages/{id}/quotes',                'verb' => 'GET'],
        ['name' => 'workPackage#createQuote',  'url' => '/api/work-packages/{id}/quotes',                'verb' => 'POST'],
        ['name' => 'workPackage#updateQuote',  'url' => '/api/work-packages/{id}/quotes/{quoteId}',      'verb' => 'PUT'],
        ['name' => 'workPackage#destroyQuote', 'url' => '/api/work-packages/{id}/quotes/{quoteId}',      'verb' => 'DELETE'],
        ['name' => 'workPackage#award',        'url' => '/api/work-packages/{id}/award',                 'verb' => 'POST'],

        // ── Availability Projects ──────────────────────────────────
        ['name' => 'availProject#index',      'url' => '/api/avail-projects',                       'verb' => 'GET'],
        ['name' => 'availProject#show',       'url' => '/api/avail-projects/{id}',                  'verb' => 'GET'],
        ['name' => 'availProject#create',     'url' => '/api/avail-projects',                       'verb' => 'POST'],
        ['name' => 'availProject#update',     'url' => '/api/avail-projects/{id}',                  'verb' => 'PUT'],
        ['name' => 'availProject#destroy',    'url' => '/api/avail-projects/{id}',                  'verb' => 'DELETE'],
        ['name' => 'availProject#addItem',    'url' => '/api/avail-projects/{id}/items',            'verb' => 'POST'],
        ['name' => 'availProject#updateItem', 'url' => '/api/avail-projects/{id}/items/{itemId}',   'verb' => 'PUT'],
        ['name' => 'availProject#deleteItem', 'url' => '/api/avail-projects/{id}/items/{itemId}',   'verb' => 'DELETE'],

        // ── Modernizations (Configuration Management) ─────────────
        ['name' => 'modernization#index',       'url' => '/api/modernizations',                               'verb' => 'GET'],
        ['name' => 'modernization#show',        'url' => '/api/modernizations/{id}',                          'verb' => 'GET'],
        ['name' => 'modernization#create',      'url' => '/api/modernizations',                               'verb' => 'POST'],
        ['name' => 'modernization#update',      'url' => '/api/modernizations/{id}',                          'verb' => 'PUT'],
        ['name' => 'modernization#destroy',     'url' => '/api/modernizations/{id}',                          'verb' => 'DELETE'],
        ['name' => 'modernization#addAsset',    'url' => '/api/modernizations/{id}/assets',                   'verb' => 'POST'],
        ['name' => 'modernization#updateAsset', 'url' => '/api/modernizations/{id}/assets/{assetEntryId}',    'verb' => 'PUT'],
        ['name' => 'modernization#removeAsset', 'url' => '/api/modernizations/{id}/assets/{assetEntryId}',    'verb' => 'DELETE'],

        // ── MBSE — Requirements ───────────────────────────────────
        ['name' => 'mbse#indexRequirements',  'url' => '/api/requirements',                         'verb' => 'GET'],
        ['name' => 'mbse#showRequirement',    'url' => '/api/requirements/{id}',                    'verb' => 'GET'],
        ['name' => 'mbse#createRequirement',  'url' => '/api/requirements',                         'verb' => 'POST'],
        ['name' => 'mbse#updateRequirement',  'url' => '/api/requirements/{id}',                    'verb' => 'PUT'],
        ['name' => 'mbse#destroyRequirement', 'url' => '/api/requirements/{id}',                    'verb' => 'DELETE'],
        ['name' => 'mbse#addTrace',           'url' => '/api/requirements/{id}/traces',             'verb' => 'POST'],
        ['name' => 'mbse#deleteTrace',        'url' => '/api/requirements/{id}/traces/{traceId}',   'verb' => 'DELETE'],

        // ── MBSE — Interfaces ─────────────────────────────────────
        ['name' => 'mbse#indexInterfaces',    'url' => '/api/interfaces',                           'verb' => 'GET'],
        ['name' => 'mbse#showInterface',      'url' => '/api/interfaces/{id}',                      'verb' => 'GET'],
        ['name' => 'mbse#createInterface',    'url' => '/api/interfaces',                           'verb' => 'POST'],
        ['name' => 'mbse#updateInterface',    'url' => '/api/interfaces/{id}',                      'verb' => 'PUT'],
        ['name' => 'mbse#destroyInterface',   'url' => '/api/interfaces/{id}',                      'verb' => 'DELETE'],

        // ── Documents (The Library) ───────────────────────────────
        ['name' => 'document#index',          'url' => '/api/documents',                          'verb' => 'GET'],
        ['name' => 'document#show',           'url' => '/api/documents/{id}',                     'verb' => 'GET'],
        ['name' => 'document#create',         'url' => '/api/documents',                          'verb' => 'POST'],
        ['name' => 'document#update',         'url' => '/api/documents/{id}',                     'verb' => 'PUT'],
        ['name' => 'document#destroy',        'url' => '/api/documents/{id}',                     'verb' => 'DELETE'],
        ['name' => 'document#getRevisions',   'url' => '/api/documents/{id}/revisions',           'verb' => 'GET'],
        ['name' => 'document#addRevision',    'url' => '/api/documents/{id}/revisions',           'verb' => 'POST'],
        ['name' => 'document#updateRevision', 'url' => '/api/documents/{id}/revisions/{revId}',   'verb' => 'PUT'],
        ['name' => 'document#deleteRevision', 'url' => '/api/documents/{id}/revisions/{revId}',   'verb' => 'DELETE'],

        // ── Platforms ─────────────────────────────────────────────
        ['name' => 'platform#index',      'url' => '/api/platforms',              'verb' => 'GET'],
        ['name' => 'platform#myPlatforms','url' => '/api/platforms/mine',         'verb' => 'GET'],
        ['name' => 'platform#show',       'url' => '/api/platforms/{id}',         'verb' => 'GET'],
        ['name' => 'platform#create',     'url' => '/api/platforms',              'verb' => 'POST'],
        ['name' => 'platform#update',     'url' => '/api/platforms/{id}',         'verb' => 'PUT'],
        ['name' => 'platform#destroy',    'url' => '/api/platforms/{id}',         'verb' => 'DELETE'],

        // ── Asset Photos ──────────────────────────────────────────────
        ['name' => 'photo#index',   'url' => '/api/assets/{assetId}/photos',              'verb' => 'GET'],
        ['name' => 'photo#create',  'url' => '/api/assets/{assetId}/photos',              'verb' => 'POST'],
        ['name' => 'photo#update',  'url' => '/api/assets/{assetId}/photos/{photoId}',    'verb' => 'PUT'],
        ['name' => 'photo#destroy', 'url' => '/api/assets/{assetId}/photos/{photoId}',    'verb' => 'DELETE'],

        // ── 3D Models ─────────────────────────────────────────────────
        ['name' => 'model#index',         'url' => '/api/assets/{assetId}/models',                          'verb' => 'GET'],
        ['name' => 'model#show',          'url' => '/api/assets/{assetId}/models/{modelId}',                'verb' => 'GET'],
        ['name' => 'model#create',        'url' => '/api/assets/{assetId}/models',                          'verb' => 'POST'],
        ['name' => 'model#update',        'url' => '/api/assets/{assetId}/models/{modelId}',                'verb' => 'PUT'],
        ['name' => 'model#destroy',       'url' => '/api/assets/{assetId}/models/{modelId}',                'verb' => 'DELETE'],
        ['name' => 'model#addHotspot',    'url' => '/api/assets/{assetId}/models/{modelId}/hotspots',       'verb' => 'POST'],
        ['name' => 'model#updateHotspot', 'url' => '/api/assets/{assetId}/models/{modelId}/hotspots/{hotspotId}', 'verb' => 'PUT'],
        ['name' => 'model#deleteHotspot', 'url' => '/api/assets/{assetId}/models/{modelId}/hotspots/{hotspotId}', 'verb' => 'DELETE'],

        // ── Files (SOP picker + folder listing) ───────────────────
        ['name' => 'files#sopFolder',      'url' => '/api/files/sop',         'verb' => 'GET'],
        ['name' => 'files#serveFile',      'url' => '/api/files/serve',       'verb' => 'GET'],
        ['name' => 'files#getTdpContents', 'url' => '/api/files/tdp',         'verb' => 'GET'],
        ['name' => 'files#createTdpFolder','url' => '/api/files/tdp',         'verb' => 'POST'],
        ['name' => 'files#listFolder',     'url' => '/api/files/list',           'verb' => 'GET'],
        ['name' => 'files#openUrl',        'url' => '/api/files/open-url',       'verb' => 'GET'],
        ['name' => 'files#ensureFolders',  'url' => '/api/files/ensure-folders', 'verb' => 'POST'],

        // ── System Canvas ─────────────────────────────────────────
        ['name' => 'canvas#index',   'url' => '/api/canvases',      'verb' => 'GET'],
        ['name' => 'canvas#show',    'url' => '/api/canvases/{id}', 'verb' => 'GET'],
        ['name' => 'canvas#create',  'url' => '/api/canvases',      'verb' => 'POST'],
        ['name' => 'canvas#update',  'url' => '/api/canvases/{id}', 'verb' => 'PUT'],
        ['name' => 'canvas#destroy', 'url' => '/api/canvases/{id}',         'verb' => 'DELETE'],
        ['name' => 'canvas#status',  'url' => '/api/canvases/{id}/status',  'verb' => 'GET'],
        ['name' => 'canvas#publish', 'url' => '/api/canvases/{id}/publish', 'verb' => 'POST'],

        // ── FMEA ──────────────────────────────────────────────────
        ['name' => 'fmea#index_worksheets',   'url' => '/api/fmea/worksheets',                                   'verb' => 'GET'],
        ['name' => 'fmea#find_or_create',     'url' => '/api/fmea/worksheets/find-or-create',                    'verb' => 'POST'],
        ['name' => 'fmea#show_worksheet',     'url' => '/api/fmea/worksheets/{id}',                              'verb' => 'GET'],
        ['name' => 'fmea#update_worksheet',   'url' => '/api/fmea/worksheets/{id}',                              'verb' => 'PUT'],
        ['name' => 'fmea#destroy_worksheet',  'url' => '/api/fmea/worksheets/{id}',                              'verb' => 'DELETE'],
        ['name' => 'fmea#publish_worksheet',  'url' => '/api/fmea/worksheets/{id}/publish',                      'verb' => 'POST'],
        ['name' => 'fmea#index_entries',      'url' => '/api/fmea/worksheets/{worksheetId}/entries',             'verb' => 'GET'],
        ['name' => 'fmea#create_entry',       'url' => '/api/fmea/worksheets/{worksheetId}/entries',             'verb' => 'POST'],
        ['name' => 'fmea#update_entry',       'url' => '/api/fmea/worksheets/{worksheetId}/entries/{entryId}',   'verb' => 'PUT'],
        ['name' => 'fmea#destroy_entry',      'url' => '/api/fmea/worksheets/{worksheetId}/entries/{entryId}',   'verb' => 'DELETE'],

        // ── RCM Decisions ─────────────────────────────────────────
        ['name' => 'rcm#index',   'url' => '/api/rcm/decisions',      'verb' => 'GET'],
        ['name' => 'rcm#show',    'url' => '/api/rcm/decisions/{id}', 'verb' => 'GET'],
        ['name' => 'rcm#upsert',  'url' => '/api/rcm/decisions',      'verb' => 'POST'],
        ['name' => 'rcm#destroy', 'url' => '/api/rcm/decisions/{id}', 'verb' => 'DELETE'],

        // ── Component Library ─────────────────────────────────────
        ['name' => 'component_library#index',   'url' => '/api/component-library',      'verb' => 'GET'],
        ['name' => 'component_library#show',    'url' => '/api/component-library/{id}', 'verb' => 'GET'],
        ['name' => 'component_library#create',  'url' => '/api/component-library',      'verb' => 'POST'],
        ['name' => 'component_library#update',  'url' => '/api/component-library/{id}', 'verb' => 'PUT'],
        ['name' => 'component_library#destroy', 'url' => '/api/component-library/{id}', 'verb' => 'DELETE'],

        // ── LOTO Sessions ─────────────────────────────────────────
        ['name' => 'loto#index',         'url' => '/api/loto',                    'verb' => 'GET'],
        ['name' => 'loto#show',          'url' => '/api/loto/{id}',               'verb' => 'GET'],
        ['name' => 'loto#create',        'url' => '/api/loto',                    'verb' => 'POST'],
        ['name' => 'loto#update',        'url' => '/api/loto/{id}',               'verb' => 'PUT'],
        ['name' => 'loto#release',       'url' => '/api/loto/{id}/release',       'verb' => 'POST'],
        ['name' => 'loto#verify',        'url' => '/api/loto/{id}/verify',        'verb' => 'POST'],
        ['name' => 'loto#destroy',       'url' => '/api/loto/{id}',               'verb' => 'DELETE'],

        // ── LOTO Device Inventory ─────────────────────────────────
        ['name' => 'loto#indexDevices',  'url' => '/api/loto/devices',            'verb' => 'GET'],
        ['name' => 'loto#createDevice',  'url' => '/api/loto/devices',            'verb' => 'POST'],
        ['name' => 'loto#showDevice',    'url' => '/api/loto/devices/{deviceId}', 'verb' => 'GET'],
        ['name' => 'loto#updateDevice',  'url' => '/api/loto/devices/{deviceId}', 'verb' => 'PUT'],
        ['name' => 'loto#destroyDevice', 'url' => '/api/loto/devices/{deviceId}', 'verb' => 'DELETE'],

        // ── Failure Mode Taxonomy (S5000F) ────────────────────────
        ['name' => 'failure_mode#index',   'url' => '/api/failure-modes',        'verb' => 'GET'],
        ['name' => 'failure_mode#show',    'url' => '/api/failure-modes/{id}',   'verb' => 'GET'],
        ['name' => 'failure_mode#create',  'url' => '/api/failure-modes',        'verb' => 'POST'],
        ['name' => 'failure_mode#update',  'url' => '/api/failure-modes/{id}',   'verb' => 'PUT'],
        ['name' => 'failure_mode#destroy', 'url' => '/api/failure-modes/{id}',   'verb' => 'DELETE'],
        ['name' => 'failure_mode#seed',    'url' => '/api/failure-modes/seed',   'verb' => 'POST'],

        // ── Readiness Report (Sprint 2C) ─────────────────────────────
        ['name' => 'health_report#generate', 'url' => '/api/health-report', 'verb' => 'GET'],

        // ── Data Import (Sprint 2A) ───────────────────────────────
        ['name' => 'import#index',   'url' => '/api/imports',              'verb' => 'GET'],
        ['name' => 'import#show',    'url' => '/api/imports/{id}',         'verb' => 'GET'],
        ['name' => 'import#create',  'url' => '/api/imports',              'verb' => 'POST'],
        ['name' => 'import#map',     'url' => '/api/imports/{id}/map',     'verb' => 'PUT'],
        ['name' => 'import#execute', 'url' => '/api/imports/{id}/execute', 'verb' => 'POST'],
        ['name' => 'import#destroy', 'url' => '/api/imports/{id}',         'verb' => 'DELETE'],
        ['name' => 'import#fields',   'url' => '/api/imports/fields',       'verb' => 'GET'],
        ['name' => 'import#profiles','url' => '/api/imports/profiles',     'verb' => 'GET'],

        // ── Energy Sources (Sprint 1C) ─────────────────────────────────
        ['name' => 'energy_source#index',   'url' => '/api/energy-sources',      'verb' => 'GET'],
        ['name' => 'energy_source#show',    'url' => '/api/energy-sources/{id}', 'verb' => 'GET'],
        ['name' => 'energy_source#create',  'url' => '/api/energy-sources',      'verb' => 'POST'],
        ['name' => 'energy_source#update',  'url' => '/api/energy-sources/{id}', 'verb' => 'PUT'],
        ['name' => 'energy_source#destroy', 'url' => '/api/energy-sources/{id}', 'verb' => 'DELETE'],

        // ── MMBP Budget Lines + UFR Export + Drilldown (Sprints 3A/3B/3C) ──
        ['name' => 'mmbp_budget#ufrExport',   'url' => '/api/budget/ufr-export',             'verb' => 'GET'],
        ['name' => 'mmbp_budget#drilldown',   'url' => '/api/budget/drilldown',              'verb' => 'GET'],
        ['name' => 'mmbp_budget#indexLines',  'url' => '/api/budget/{id}/lines',             'verb' => 'GET'],
        ['name' => 'mmbp_budget#createLine',  'url' => '/api/budget/{id}/lines',             'verb' => 'POST'],
        ['name' => 'mmbp_budget#updateLine',  'url' => '/api/budget/{id}/lines/{lineId}',    'verb' => 'PUT'],
        ['name' => 'mmbp_budget#destroyLine', 'url' => '/api/budget/{id}/lines/{lineId}',    'verb' => 'DELETE'],

        // ── Manpower & Skills Registry (Sprint 3C) ────────────────────
        ['name' => 'manpower#indexPersonnel',      'url' => '/api/manpower/personnel',                           'verb' => 'GET'],
        ['name' => 'manpower#showPersonnel',       'url' => '/api/manpower/personnel/{id}',                      'verb' => 'GET'],
        ['name' => 'manpower#createPersonnel',     'url' => '/api/manpower/personnel',                           'verb' => 'POST'],
        ['name' => 'manpower#updatePersonnel',     'url' => '/api/manpower/personnel/{id}',                      'verb' => 'PUT'],
        ['name' => 'manpower#destroyPersonnel',    'url' => '/api/manpower/personnel/{id}',                      'verb' => 'DELETE'],
        ['name' => 'manpower#indexPersonnelSkills','url' => '/api/manpower/personnel/{id}/skills',               'verb' => 'GET'],
        ['name' => 'manpower#addPersonnelSkill',   'url' => '/api/manpower/personnel/{id}/skills',               'verb' => 'POST'],
        ['name' => 'manpower#updatePersonnelSkill','url' => '/api/manpower/personnel/{id}/skills/{skillLinkId}', 'verb' => 'PUT'],
        ['name' => 'manpower#removePersonnelSkill','url' => '/api/manpower/personnel/{id}/skills/{skillLinkId}', 'verb' => 'DELETE'],
        ['name' => 'manpower#indexSkills',         'url' => '/api/manpower/skills',                              'verb' => 'GET'],
        ['name' => 'manpower#showSkill',           'url' => '/api/manpower/skills/{skillId}',                    'verb' => 'GET'],
        ['name' => 'manpower#createSkill',         'url' => '/api/manpower/skills',                              'verb' => 'POST'],
        ['name' => 'manpower#updateSkill',         'url' => '/api/manpower/skills/{skillId}',                    'verb' => 'PUT'],
        ['name' => 'manpower#destroySkill',        'url' => '/api/manpower/skills/{skillId}',                    'verb' => 'DELETE'],
        ['name' => 'manpower#indexRequirements',   'url' => '/api/manpower/requirements',                        'verb' => 'GET'],
        ['name' => 'manpower#createRequirement',   'url' => '/api/manpower/requirements',                        'verb' => 'POST'],
        ['name' => 'manpower#updateRequirement',   'url' => '/api/manpower/requirements/{reqId}',                'verb' => 'PUT'],
        ['name' => 'manpower#destroyRequirement',  'url' => '/api/manpower/requirements/{reqId}',                'verb' => 'DELETE'],

        // ── Training Curriculum (Sprint 4B) ───────────────────────────
        ['name' => 'training#index',   'url' => '/api/training',        'verb' => 'GET'],
        ['name' => 'training#show',    'url' => '/api/training/{id}',   'verb' => 'GET'],
        ['name' => 'training#create',  'url' => '/api/training',        'verb' => 'POST'],
        ['name' => 'training#update',  'url' => '/api/training/{id}',   'verb' => 'PUT'],
        ['name' => 'training#destroy', 'url' => '/api/training/{id}',   'verb' => 'DELETE'],

        // ── Shop user assignments (Sprint 1B) ─────────────────────────
        ['name' => 'shop#indexUsers',  'url' => '/api/shops/{id}/users',             'verb' => 'GET'],
        ['name' => 'shop#addUser',     'url' => '/api/shops/{id}/users',             'verb' => 'POST'],
        ['name' => 'shop#removeUser',  'url' => '/api/shops/{id}/users/{userId}',    'verb' => 'DELETE'],
    ],
];
