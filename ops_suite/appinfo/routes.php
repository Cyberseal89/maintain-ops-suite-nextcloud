<?php
declare(strict_types=1);
return [
    'routes' => [
        // ── Page ──────────────────────────────────────────────────
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],

        // ── Assets ────────────────────────────────────────────────
        ['name' => 'asset#index',   'url' => '/api/assets',      'verb' => 'GET'],
        ['name' => 'asset#show',    'url' => '/api/assets/{id}', 'verb' => 'GET'],
        ['name' => 'asset#create',  'url' => '/api/assets',      'verb' => 'POST'],
        ['name' => 'asset#update',  'url' => '/api/assets/{id}', 'verb' => 'PUT'],
        ['name' => 'asset#destroy', 'url' => '/api/assets/{id}', 'verb' => 'DELETE'],

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
        ['name' => 'settings#get',  'url' => '/api/settings', 'verb' => 'GET'],
        ['name' => 'settings#save', 'url' => '/api/settings', 'verb' => 'POST'],

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
        ['name' => 'workPackage#index',      'url' => '/api/work-packages',                        'verb' => 'GET'],
        ['name' => 'workPackage#show',       'url' => '/api/work-packages/{id}',                   'verb' => 'GET'],
        ['name' => 'workPackage#create',     'url' => '/api/work-packages',                        'verb' => 'POST'],
        ['name' => 'workPackage#update',     'url' => '/api/work-packages/{id}',                   'verb' => 'PUT'],
        ['name' => 'workPackage#destroy',    'url' => '/api/work-packages/{id}',                   'verb' => 'DELETE'],
        ['name' => 'workPackage#addItem',    'url' => '/api/work-packages/{id}/items',             'verb' => 'POST'],
        ['name' => 'workPackage#removeItem', 'url' => '/api/work-packages/{id}/items/{itemId}',    'verb' => 'DELETE'],
        // ── Availability Projects ──────────────────────────────────
        ['name' => 'availProject#index',      'url' => '/api/avail-projects',                       'verb' => 'GET'],
        ['name' => 'availProject#show',       'url' => '/api/avail-projects/{id}',                  'verb' => 'GET'],
        ['name' => 'availProject#create',     'url' => '/api/avail-projects',                       'verb' => 'POST'],
        ['name' => 'availProject#update',     'url' => '/api/avail-projects/{id}',                  'verb' => 'PUT'],
        ['name' => 'availProject#destroy',    'url' => '/api/avail-projects/{id}',                  'verb' => 'DELETE'],
        ['name' => 'availProject#addItem',    'url' => '/api/avail-projects/{id}/items',            'verb' => 'POST'],
        ['name' => 'availProject#updateItem', 'url' => '/api/avail-projects/{id}/items/{itemId}',   'verb' => 'PUT'],
        ['name' => 'availProject#deleteItem', 'url' => '/api/avail-projects/{id}/items/{itemId}',   'verb' => 'DELETE'],
        // ── Modernizations ────────────────────────────────────────
        ['name' => 'modernization#index',     'url' => '/api/modernizations',                      'verb' => 'GET'],
        ['name' => 'modernization#show',      'url' => '/api/modernizations/{id}',                 'verb' => 'GET'],
        ['name' => 'modernization#create',    'url' => '/api/modernizations',                      'verb' => 'POST'],
        ['name' => 'modernization#update',    'url' => '/api/modernizations/{id}',                 'verb' => 'PUT'],
        ['name' => 'modernization#destroy',   'url' => '/api/modernizations/{id}',                 'verb' => 'DELETE'],
        ['name' => 'modernization#getDocs',   'url' => '/api/modernizations/{id}/docs',            'verb' => 'GET'],
        ['name' => 'modernization#addDoc',    'url' => '/api/modernizations/{id}/docs',            'verb' => 'POST'],
        ['name' => 'modernization#updateDoc', 'url' => '/api/modernizations/{id}/docs/{docId}',    'verb' => 'PUT'],
        ['name' => 'modernization#deleteDoc', 'url' => '/api/modernizations/{id}/docs/{docId}',    'verb' => 'DELETE'],
        // ── Platforms ─────────────────────────────────────────────
        ['name' => 'platform#index',      'url' => '/api/platforms',              'verb' => 'GET'],
        ['name' => 'platform#myPlatforms','url' => '/api/platforms/mine',         'verb' => 'GET'],
        ['name' => 'platform#show',       'url' => '/api/platforms/{id}',         'verb' => 'GET'],
        ['name' => 'platform#create',     'url' => '/api/platforms',              'verb' => 'POST'],
        ['name' => 'platform#update',     'url' => '/api/platforms/{id}',         'verb' => 'PUT'],
        ['name' => 'platform#destroy',    'url' => '/api/platforms/{id}',         'verb' => 'DELETE'],
        // ── Files (SOP picker + folder listing) ───────────────────
        ['name' => 'files#sopFolder',  'url' => '/api/files/sop',         'verb' => 'GET'],
        ['name' => 'files#listFolder', 'url' => '/api/files/list',        'verb' => 'GET'],
        ['name' => 'files#openUrl',    'url' => '/api/files/open-url',    'verb' => 'GET'],
    ],
];
