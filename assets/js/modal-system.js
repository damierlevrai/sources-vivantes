/* ============================================
   SOURCES VIVANTES - MODAL SYSTEM & MAPS CORRIGÉ
   Gestion des modals sources et carte interactive
   ============================================ */

/* ============================================
   1. VARIABLES GLOBALES
   ============================================ */

let map = null;
let markers = [];
let currentModal = null;
let sourcesData = {};
let isMapLoaded = false;
let isDataLoaded = false;

/* ============================================
   2. INITIALISATION GÉNÉRALE
   ============================================ */

function initModalSystem() {
    console.log('🌊 Initialisation Sources Vivantes Modal System');

    // Créer le conteneur modal s'il n'existe pas
    if (!document.getElementById('modal-overlay')) {
        createModalContainer();
    }

    // Écouter les clics de fermeture
    document.addEventListener('click', handleModalClose);
    document.addEventListener('keydown', handleKeyDown);

    console.log('✅ Modal system initialisé');
}

function createModalContainer() {
    const modalHTML = `
        <div id="modal-overlay" class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title">Source</h2>
                    <button class="modal-close" aria-label="Fermer">×</button>
                </div>
                <div class="modal-body" id="modal-content">
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/* ============================================
   3. CHARGEMENT DONNÉES JSON
   ============================================ */

async function loadSourcesFromJSON() {
    try {
        console.log('📄 Chargement des données sources depuis JSON...');
        const response = await fetch('documents/data/sources.json');

        if (response.ok) {
            const data = await response.json();
            sourcesData = data.sources || {};

            console.log('✅ Données sources chargées:', Object.keys(sourcesData).length, 'sources');
            console.log('📊 Sources:', Object.keys(sourcesData));

            isDataLoaded = true;
            
            // Mettre à jour l'affichage
            updateHeroStats();
            
            // Si la carte est déjà chargée, ajouter les marqueurs
            if (isMapLoaded && map) {
                setTimeout(() => {
                    addSourceMarkers();
                }, 500);
            }

            return true;
        } else {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
    } catch (error) {
        console.warn('⚠️ Impossible de charger sources.json:', error.message);
        console.log('🔄 Utilisation des données par défaut (mode démo)');

        // Données de démonstration minimales si JSON indisponible
        sourcesData = {
            "demo": {
                id: "demo",
                nom: "Source de Démonstration",
                commune: "Exemple-sur-vézère",
                departement: "Dordogne",
                coordonnees: { lat: 44.9759, lng: 1.0344 },
                derniere_analyse: {
                    date: "2025-06-15",
                    statut: "conforme",
                    laboratoire: "Mode démonstration",
                    parametres: {
                        nitrates: 8.2,
                        nitrates_limite: 50,
                        bacteries: 0,
                        bacteries_limite: 0,
                        ph: 7.4,
                        ph_min: 6.5,
                        ph_max: 9.0
                    }
                },
                caracteristiques: {
                    frequentation: "forte",
                    acces: {
                        parking: "Parking à 100m",
                        duree_marche: "5 min de marche"
                    }
                },
                description: "Source de démonstration pour présentation du système Sources Vivantes."
            }
        };

        isDataLoaded = true;
        updateHeroStats();
        
        if (isMapLoaded && map) {
            setTimeout(() => {
                addSourceMarkers();
            }, 500);
        }
        return false;
    }
}

/* ============================================
   4. GOOGLE MAPS INTEGRATION
   ============================================ */

window.initMap = function() {
    console.log('🗺️ Initialisation Google Maps');

    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.log('❌ Élément carte non trouvé');
        return;
    }

    // Initialiser la carte avec configuration simplifiée
    map = new google.maps.Map(mapElement, {
        center: SOURCES_CONFIG.map.defaultCenter,
        zoom: SOURCES_CONFIG.map.defaultZoom,
        styles: getMapStyles(),
        gestureHandling: 'cooperative'
    });

    isMapLoaded = true;
    console.log('✅ Google Maps initialisé');

    // Ajouter les marqueurs si les données sont déjà chargées
    if (isDataLoaded && Object.keys(sourcesData).length > 0) {
        setTimeout(() => {
            addSourceMarkers();
        }, 500);
    }

    // Initialiser les filtres
    initMapFilters();
};

function getMapStyles() {
    return [
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#e9f4f7" }]
        },
        {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{ "color": "#f5f9f5" }]
        }
    ];
}

function addSourceMarkers() {
    console.log('📍 Ajout des marqueurs sources...');
    
    // Supprimer les marqueurs existants
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    if (!map || !sourcesData || Object.keys(sourcesData).length === 0) {
        console.log('❌ Carte ou données non disponibles');
        return;
    }

    Object.values(sourcesData).forEach(source => {
        try {
            const marker = createSourceMarker(source);
            if (marker) {
                markers.push(marker);
                console.log('✅ Marqueur ajouté:', source.nom);
            }
        } catch (error) {
            console.error('❌ Erreur création marqueur:', source.nom, error);
        }
    });

    console.log('📍 Total marqueurs créés:', markers.length);
}

function createSourceMarker(source) {
    if (!source.coordonnees) {
        console.warn('❌ Coordonnées manquantes pour:', source.nom);
        return null;
    }

    const statusConfig = {
        'conforme': { color: '#10b981', icon: '✅' },
        'non-conforme': { color: '#ef4444', icon: '❌' },
        'attente': { color: '#f59e0b', icon: '🔄' }
    };

    const config = statusConfig[source.derniere_analyse?.statut] || statusConfig['attente'];

    // Créer marqueur standard (compatible avec toutes les versions)
    const marker = new google.maps.Marker({
        position: source.coordonnees,
        map: map,
        title: `${source.nom} - ${source.commune}`,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: config.color,
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2
        }
    });

    marker.sourceId = source.id;

    const infoContent = `
        <div style="max-width: 300px; font-family: -apple-system, sans-serif;">
            <h3 style="margin: 0 0 0.5rem; color: #0891b2; font-size: 1.1rem;">${source.nom}</h3>
            <p style="margin: 0 0 0.5rem; color: #6b7280; font-size: 0.9rem;">${source.commune}, ${source.departement}</p>
            
            <div style="display: flex; align-items: center; gap: 0.5rem; margin: 0.8rem 0; padding: 0.5rem; background: ${config.color}20; border-radius: 6px;">
                <span style="font-size: 1.2rem;">${config.icon}</span>
                <span style="font-weight: 600; color: ${config.color};">
                    ${source.derniere_analyse?.statut === 'conforme' ? 'Conforme' :
                      source.derniere_analyse?.statut === 'non-conforme' ? 'Non conforme' : 'En attente'}
                </span>
            </div>
            
            <p style="margin: 0.5rem 0; font-size: 0.85rem; color: #6b7280;">
                Analyse du ${formatDate(source.derniere_analyse?.date || '2025-01-01')}
            </p>
            
            <div style="margin-top: 1rem; text-align: center;">
                <button onclick="openSource('${source.id}')" 
                        style="background: #0891b2; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Voir les détails
                </button>
            </div>
        </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
        content: infoContent
    });

    marker.addListener('click', () => {
        // Fermer toutes les autres infobulles
        markers.forEach(m => {
            if (m.infoWindow) m.infoWindow.close();
        });
        infoWindow.open(map, marker);
    });

    marker.infoWindow = infoWindow;
    return marker;
}

/* ============================================
   5. GESTION DES MODALS SOURCES
   ============================================ */

function openSource(sourceId) {
    const source = sourcesData[sourceId];
    if (!source) {
        console.warn(`❌ Source "${sourceId}" non trouvée`);
        showNotification('Source non trouvée', 'error');
        return;
    }

    console.log(`🗂️ Ouverture source: ${source.nom}`);

    try {
        // Mettre à jour l'URL sans recharger
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('source', sourceId);
        history.pushState({ modal: sourceId }, '', newUrl.toString());

        // Générer le contenu de la modal
        const modalContent = generateSourceModalContent(source);

        // Afficher la modal
        const overlay = document.getElementById('modal-overlay');
        const title = overlay.querySelector('.modal-title');
        const content = overlay.querySelector('.modal-body');

        title.textContent = `${source.nom} - ${source.commune}`;
        content.innerHTML = modalContent;

        // Activer la modal
        overlay.classList.add('active');
        currentModal = sourceId;

        // Focus pour l'accessibilité
        const closeButton = overlay.querySelector('.modal-close');
        if (closeButton) closeButton.focus();

        // Désactiver le scroll du body
        document.body.style.overflow = 'hidden';

        console.log('✅ Modal source ouverte avec succès');

    } catch (error) {
        console.error('❌ Erreur lors de l\'ouverture de la source:', error);
        console.error('📄 Données de la source:', source);
        showNotification(`Erreur lors de l'ouverture de la source: ${error.message}`, 'error');
        
        // Modal d'erreur simple
        const overlay = document.getElementById('modal-overlay');
        const title = overlay.querySelector('.modal-title');
        const content = overlay.querySelector('.modal-body');
        
        title.textContent = `Erreur - ${source.nom}`;
        content.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h3 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Erreur de chargement</h3>
                <p>Une erreur s'est produite lors du chargement des détails de cette source.</p>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: #6b7280;">
                    Erreur technique: ${error.message}
                </p>
                <button onclick="closeModal()" style="margin-top: 1.5rem; padding: 0.8rem 1.5rem; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Fermer
                </button>
            </div>
        `;
        
        overlay.classList.add('active');
        currentModal = sourceId;
        document.body.style.overflow = 'hidden';
    }
}

function generateSourceModalContent(source) {
    const analyse = source.derniere_analyse || {};
    const statut = analyse.statut || 'attente';

    // Icône et couleur selon le statut
    const statusConfig = {
        'conforme': { icon: '✅', color: '#10b981', label: 'Eau conforme' },
        'non-conforme': { icon: '❌', color: '#ef4444', label: 'Eau non conforme' },
        'attente': { icon: '🔄', color: '#f59e0b', label: 'Analyse en cours' }
    };

    const config = statusConfig[statut] || statusConfig['attente'];

    // Adapter les champs selon la structure JSON réelle
    const caracteristiques = source.caracteristiques || {};
    const acces = caracteristiques.acces || {};

    return `
        <div class="source-modal-content">
            ${source.photos ? generatePhotosSection(source.photos, source.nom) : ''}

            <div class="source-status" style="background: ${config.color}20; border-left: 4px solid ${config.color}; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-size: 2rem;">${config.icon}</span>
                    <div>
                        <h3 style="color: ${config.color}; margin: 0; font-size: 1.3rem;">${config.label}</h3>
                        <p style="margin: 0.5rem 0 0; color: #6b7280;">
                            Analyse du ${formatDate(analyse.date || '2025-01-01')} - ${analyse.laboratoire || 'Laboratoire agréé'}
                        </p>
                    </div>
                </div>
            </div>

            <div class="source-info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div class="info-card">
                    <h4 style="color: #0891b2; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <span>📍</span> Localisation
                    </h4>
                    <p><strong>Commune :</strong> ${source.commune}</p>
                    <p><strong>Département :</strong> ${source.departement}</p>
                    <p><strong>Coordonnées :</strong> ${source.coordonnees.lat.toFixed(4)}, ${source.coordonnees.lng.toFixed(4)}</p>
                </div>
                
                <div class="info-card">
                    <h4 style="color: #0891b2; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <span>🚶‍♀️</span> Accès
                    </h4>
                    <p><strong>Fréquentation :</strong> ${caracteristiques.frequentation || 'Non renseignée'}</p>
                    <p><strong>Parking :</strong> ${acces.parking || 'Non renseigné'}</p>
                    <p><strong>Marche :</strong> ${acces.duree_marche || 'Non renseigné'}</p>
                </div>
            </div>

            ${analyse.parametres ? generateParametersSection(analyse.parametres) : ''}
            ${analyse.problemes ? generateProblemsSection(analyse.problemes) : ''}
            ${source.recommandations ? generateRecommendationsSection(source.recommandations) : ''}
            ${source.sources_medias ? generateMediaSection(source.sources_medias) : ''}
            ${source.historique_analyses ? generateHistorySection(source.historique_analyses) : ''}

            <div class="source-description" style="margin: 2rem 0; padding: 1.5rem; background: rgba(8, 145, 178, 0.05); border-radius: 12px;">
                <h4 style="color: #0891b2; margin-bottom: 1rem;">💧 À propos de cette source</h4>
                <p>${source.description}</p>
                ${source.legende_locale ? `<p style="margin-top: 1rem; font-style: italic; color: #6b7280;"><strong>Légende :</strong> ${source.legende_locale}</p>` : ''}
            </div>

            ${source.historique_exceptionnel ? generateHistoricSection(source.historique_exceptionnel) : ''}
            ${source.contexte_unesco ? generateUnescoSection(source.contexte_unesco) : ''}
            ${source.frequentation_historique ? generateHistoricalFrequentationSection(source.frequentation_historique) : ''}
            ${source.patrimoine_associe ? generateAssociatedHeritageSection(source.patrimoine_associe) : ''}
            ${generatePracticalInfoSection(source)}
            ${source.surnom ? generateNicknameSection(source.surnom, source.legende) : ''}

            <div class="source-actions" style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; flex-wrap: wrap;">
                <button onclick="shareSource('${source.id}')" class="btn btn-secondary">
                    <span>📤</span> Partager
                </button>
                <button onclick="showOnMap('${source.id}')" class="btn btn-primary">
                    <span>🗺️</span> Voir sur la carte
                </button>
                <button onclick="openSignalementPage('${source.id}')" class="btn btn-warning">
                    <span>⚠️</span> Signalement
                </button>
            </div>

            <div class="legal-notice" style="margin-top: 2rem; padding: 1rem; background: rgba(107, 114, 128, 0.1); border-radius: 8px; font-size: 0.9rem; color: #6b7280; text-align: center;">
                <strong>⚖️ Information uniquement</strong><br>
                Ces données sont fournies à titre informatif. Sources Vivantes ne délivre pas d'autorisation de consommation. 
                En cas de doute, consultez votre médecin ou les autorités sanitaires locales.
            </div>
        </div>
    `;
}

function generateParametersSection(parametres) {
    if (!parametres) return '';

    let paramCards = '';

    // Nitrates
    if (parametres.nitrates !== undefined) {
        paramCards += generateParameterCard('Nitrates', parametres.nitrates, parametres.nitrates_limite || 50, 'mg/L');
    }

    // Bactéries
    if (parametres.bacteries !== undefined) {
        paramCards += generateParameterCard('Bactéries', parametres.bacteries, parametres.bacteries_limite || 0, 'CFU/100mL');
    }

    // pH
    if (parametres.ph !== undefined) {
        const phLimit = `${parametres.ph_min || 6.5}-${parametres.ph_max || 9.0}`;
        paramCards += generateParameterCard('pH', parametres.ph, phLimit, '');
    }

    // Conductivité
    if (parametres.conductivite !== undefined) {
        paramCards += generateParameterCard('Conductivité', parametres.conductivite, null, 'µS/cm');
    }

    if (paramCards) {
        return `
            <div class="analysis-section" style="margin-bottom: 2rem;">
                <h4 style="color: #0891b2; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>🧪</span> Paramètres d'analyse
                </h4>
                <div class="parameters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${paramCards}
                </div>
            </div>
        `;
    }

    return '';
}

function generateParameterCard(name, value, limit, unit) {
    let statusColor = '#10b981'; // Vert par défaut
    let statusIcon = '✅';
    let statusText = 'Conforme';

    // Logique de conformité selon le paramètre
    if (name === 'Nitrates' && limit) {
        if (value > limit) {
            statusColor = '#ef4444';
            statusIcon = '❌';
            statusText = 'Dépassé';
        }
    } else if (name === 'Bactéries' && limit !== null) {
        if (value > limit) {
            statusColor = '#ef4444';
            statusIcon = '❌';
            statusText = 'Présence';
        }
    } else if (name === 'pH') {
        const [min, max] = limit.split('-').map(Number);
        if (value < min || value > max) {
            statusColor = '#ef4444';
            statusIcon = '❌';
            statusText = 'Hors norme';
        }
    }

    return `
        <div class="parameter-card" style="padding: 1rem; background: white; border-radius: 8px; border: 1px solid rgba(8, 145, 178, 0.1); text-align: center;">
            <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">${statusIcon}</div>
            <h5 style="margin-bottom: 0.5rem; color: #1f2937;">${name}</h5>
            <p style="font-size: 1.2rem; font-weight: 600; color: ${statusColor}; margin-bottom: 0.5rem;">
                ${value} ${unit}
            </p>
            ${limit ? `<p style="font-size: 0.8rem; color: #6b7280;">Limite: ${limit} ${unit}</p>` : ''}
            <p style="font-size: 0.8rem; color: ${statusColor}; font-weight: 500;">${statusText}</p>
        </div>
    `;
}

// Fonctions auxiliaires pour les sections de modal
function generatePhotosSection(photos, sourceName) {
    if (!photos || photos.length === 0) return '';

    return `
        <div class="photos-section" style="margin-bottom: 2rem;">
            <div class="photos-gallery" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                ${photos.map(photo => `
                    <div class="photo-item" style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <img src="${photo}" 
                             alt="${sourceName}" 
                             style="width: 100%; height: 150px; object-fit: cover; cursor: pointer;"
                             onclick="openPhotoModal('${photo}', '${sourceName}')"
                             onerror="this.style.display='none'">
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateMediaSection(sourcesMedias) {
    if (!sourcesMedias || sourcesMedias.length === 0) return '';

    return `
        <div class="media-section" style="margin: 2rem 0; padding: 1.5rem; background: rgba(59, 130, 246, 0.05); border-radius: 12px;">
            <h4 style="color: #3b82f6; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>📰</span> Dans les médias
            </h4>
            <div class="media-list" style="display: flex; flex-direction: column; gap: 1rem;">
                ${sourcesMedias.map(media => `
                    <div class="media-item" style="padding: 1rem; background: white; border-radius: 8px; border-left: 3px solid #3b82f6;">
                        <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; flex-wrap: wrap;">
                            <div style="flex: 1;">
                                <p style="margin: 0 0 0.5rem; font-weight: 600; color: #1f2937;">
                                    ${media.media || media.source || 'Source'}
                                </p>
                                ${media.date ? `
                                    <p style="margin: 0 0 0.5rem; font-size: 0.9rem; color: #6b7280;">
                                        ${formatDate(media.date)}
                                    </p>
                                ` : ''}
                                ${media.citation ? `<p style="margin: 0; font-style: italic; color: #374151;">"${media.citation}"</p>` : ''}
                                ${media.titre ? `<p style="margin: 0; font-weight: 500; color: #374151;">${media.titre}</p>` : ''}
                                ${media.note ? `<p style="margin: 0.5rem 0 0; font-size: 0.85rem; color: #6b7280; font-style: italic;">${media.note}</p>` : ''}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
                                ${media.url ? `
                                    <a href="${media.url}" 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-size: 0.85rem; white-space: nowrap;">
                                        📖 Lire l'article
                                    </a>
                                ` : ''}
                                ${(media.contact || media.phone) ? `
                                    <div style="font-size: 0.85rem; color: #6b7280; text-align: right;">
                                        ${media.contact ? `<p style="margin: 0;">✉️ ${media.contact}</p>` : ''}
                                        ${media.phone ? `<p style="margin: 0;">📞 ${media.phone}</p>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateHistoricSection(historique) {
    if (!historique || typeof historique !== 'object') return '';

    return `
        <div class="historic-section" style="margin: 2rem 0; padding: 1.5rem; background: rgba(156, 163, 175, 0.1); border-radius: 12px;">
            <h4 style="color: #6b7280; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>🏛️</span> Historique exceptionnel
            </h4>
            <div class="historic-timeline" style="display: grid; gap: 0.8rem;">
                ${Object.entries(historique).map(([periode, description]) => `
                    <div style="display: flex; gap: 1rem; align-items: start;">
                        <span style="background: #6b7280; color: white; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize; white-space: nowrap;">
                            ${periode.replace('_', ' ')}
                        </span>
                        <p style="margin: 0; color: #374151; flex: 1;">
                            ${description || ''}
                        </p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generatePracticalInfoSection(source) {
    const caracteristiques = source.caracteristiques || {};
    const sourceType = caracteristiques.source || {};
    let sections = [];

    // Section caractéristiques de la source
    if (sourceType.type || sourceType.debit || sourceType.temperature) {
        sections.push(`
            <div class="source-characteristics" style="margin-bottom: 1.5rem;">
                <h5 style="color: #0891b2; margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>🌊</span> Caractéristiques de la source
                </h5>
                <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid rgba(8, 145, 178, 0.1);">
                    ${sourceType.type ? `<p style="margin: 0 0 0.5rem;"><strong>Type :</strong> ${sourceType.type}</p>` : ''}
                    ${sourceType.debit ? `<p style="margin: 0 0 0.5rem;"><strong>Débit :</strong> ${sourceType.debit}</p>` : ''}
                    ${sourceType.temperature ? `<p style="margin: 0;"><strong>Température :</strong> ${sourceType.temperature}</p>` : ''}
                </div>
            </div>
        `);
    }

    // Section usage réel
    if (source.usage_reel) {
        sections.push(`
            <div class="real-usage" style="margin-bottom: 1.5rem;">
                <h5 style="color: #10b981; margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>👥</span> Usage observé
                </h5>
                <div style="background: rgba(16, 185, 129, 0.05); padding: 1rem; border-radius: 8px; border-left: 3px solid #10b981;">
                    <p style="margin: 0; color: #047857; font-weight: 500;">${source.usage_reel}</p>
                </div>
            </div>
        `);
    }

    // Section vertus attribuées - gérer string ET array
    if (source.vertus_attribuees) {
        let vertusArray = [];
        
        if (typeof source.vertus_attribuees === 'string') {
            // Si c'est une string, la séparer par virgules
            vertusArray = source.vertus_attribuees.split(',').map(v => v.trim()).filter(v => v.length > 0);
        } else if (Array.isArray(source.vertus_attribuees)) {
            // Si c'est déjà un array
            vertusArray = source.vertus_attribuees;
        }
        
        if (vertusArray.length > 0) {
            sections.push(`
                <div class="attributed-virtues" style="margin-bottom: 1.5rem;">
                    <h5 style="color: #8b5cf6; margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                        <span>✨</span> Vertus traditionnelles
                    </h5>
                    <div style="background: rgba(139, 92, 246, 0.05); padding: 1rem; border-radius: 8px; border-left: 3px solid #8b5cf6;">
                        <ul style="margin: 0; padding-left: 1.2rem; color: #6b21a8;">
                            ${vertusArray.map(vertu => `<li style="margin-bottom: 0.3rem;">${vertu}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `);
        }
    }

    // Section témoignages documentés
    if (source.temoignages_guerisons_documentes && source.temoignages_guerisons_documentes.length > 0) {
        sections.push(`
            <div class="documented-testimonies" style="margin-bottom: 1.5rem;">
                <h5 style="color: #059669; margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>📋</span> Témoignages documentés
                </h5>
                <div style="background: rgba(5, 150, 105, 0.05); padding: 1rem; border-radius: 8px; border-left: 3px solid #059669;">
                    ${source.temoignages_guerisons_documentes.map(temoignage => `
                        <div style="margin-bottom: 1rem; padding: 0.8rem; background: white; border-radius: 6px;">
                            <p style="margin: 0 0 0.3rem; font-weight: 600; color: #047857;">
                                ${temoignage.nom} ${temoignage.age ? `(${temoignage.age})` : ''}
                            </p>
                            <p style="margin: 0 0 0.3rem; font-size: 0.9rem; color: #6b7280;">
                                ${temoignage.date_guerison || temoignage.date} - ${temoignage.pathologie}
                            </p>
                            ${temoignage.temoignage_public || temoignage.temoignage_ecrit ? `
                                <p style="margin: 0; font-size: 0.85rem; color: #047857; font-style: italic;">
                                    Témoignage public: ${temoignage.temoignage_public || temoignage.temoignage_ecrit}
                                </p>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
    }

    // Section contexte historique exceptionnel
    if (source.contexte_historique_exceptionnel) {
        sections.push(`
            <div class="exceptional-history" style="margin-bottom: 1.5rem;">
                <h5 style="color: #dc2626; margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>📜</span> Contexte historique
                </h5>
                <div style="background: rgba(220, 38, 38, 0.05); padding: 1rem; border-radius: 8px; border-left: 3px solid #dc2626;">
                    ${Object.entries(source.contexte_historique_exceptionnel).map(([periode, description]) => `
                        <div style="margin-bottom: 0.8rem;">
                            <strong style="color: #dc2626; text-transform: capitalize;">
                                ${periode.replace('_', ' ')} :
                            </strong>
                            <span style="color: #7f1d1d; margin-left: 0.5rem;">${description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
    }

    // Section avantage/problématique
    if (source.avantage || source.problematique) {
        sections.push(`
            <div class="source-context" style="margin-bottom: 1.5rem;">
                ${source.avantage ? `
                    <div style="background: rgba(16, 185, 129, 0.05); padding: 1rem; border-radius: 8px; border-left: 3px solid #10b981; margin-bottom: 1rem;">
                        <h6 style="color: #10b981; margin: 0 0 0.5rem; font-size: 0.9rem; font-weight: 600;">✅ Avantages</h6>
                        <p style="margin: 0; color: #047857; font-size: 0.9rem;">${source.avantage}</p>
                    </div>
                ` : ''}
                ${source.problematique ? `
                    <div style="background: rgba(245, 158, 11, 0.05); padding: 1rem; border-radius: 8px; border-left: 3px solid #f59e0b;">
                        <h6 style="color: #f59e0b; margin: 0 0 0.5rem; font-size: 0.9rem; font-weight: 600;">⚠️ Problématique</h6>
                        <p style="margin: 0; color: #92400e; font-size: 0.9rem;">${source.problematique}</p>
                    </div>
                ` : ''}
            </div>
        `);
    }

    if (sections.length === 0) return '';

    return `
        <div class="practical-info" style="margin: 2rem 0;">
            <h4 style="color: #0891b2; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>ℹ️</span> Informations pratiques
            </h4>
            ${sections.join('')}
        </div>
    `;
}

function generateProblemsSection(problems) {
    if (!problems || problems.length === 0) return '';
    
    return `
        <div class="problems-section" style="margin: 2rem 0; padding: 1.5rem; background: rgba(239, 68, 68, 0.05); border-radius: 12px; border-left: 4px solid #ef4444;">
            <h4 style="color: #ef4444; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>⚠️</span> Problèmes identifiés
            </h4>
            <ul style="margin: 0; padding-left: 1.5rem;">
                ${problems.map(problem => `<li style="margin-bottom: 0.5rem; color: #7f1d1d;">${problem}</li>`).join('')}
            </ul>
        </div>
    `;
}

function generateRecommendationsSection(recommendations) {
    if (!recommendations || recommendations.length === 0) return '';
    
    return `
        <div class="recommendations-section" style="margin: 2rem 0; padding: 1.5rem; background: rgba(245, 158, 11, 0.05); border-radius: 12px; border-left: 4px solid #f59e0b;">
            <h4 style="color: #f59e0b; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>💡</span> Recommandations
            </h4>
            <ul style="margin: 0; padding-left: 1.5rem;">
                ${recommendations.map(rec => `<li style="margin-bottom: 0.5rem; color: #92400e;">${rec}</li>`).join('')}
            </ul>
        </div>
    `;
}

function generateHistorySection(history) {
    if (!history || history.length === 0) return '';

    return `
        <div class="history-section" style="margin: 2rem 0;">
            <h4 style="color: #0891b2; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>📊</span> Historique des analyses
            </h4>
            <div class="history-timeline" style="max-height: 200px; overflow-y: auto;">
                ${history.map(analyse => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; margin-bottom: 0.5rem; background: rgba(8, 145, 178, 0.03); border-radius: 8px; border-left: 3px solid ${analyse.statut === 'conforme' ? '#10b981' : '#ef4444'};">
                        <div>
                            <span style="font-weight: 600;">${formatDate(analyse.date)}</span>
                            <span style="margin-left: 1rem; color: #6b7280;">Nitrates: ${analyse.nitrates} mg/L</span>
                        </div>
                        <span style="color: ${analyse.statut === 'conforme' ? '#10b981' : '#ef4444'};">
                            ${analyse.statut === 'conforme' ? '✅' : '❌'}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function openPhotoModal(photoUrl, sourceName) {
    // Simple modal pour agrandir les photos
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
        align-items: center; justify-content: center; cursor: pointer;
    `;

    const img = document.createElement('img');
    img.src = photoUrl;
    img.alt = sourceName;
    img.style.cssText = `
        max-width: 90%; max-height: 90%; border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `;

    modal.appendChild(img);
    modal.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
}

function generateUnescoSection(contexteUnesco) {
    if (!contexteUnesco || typeof contexteUnesco !== 'object') return '';

    return `
        <div class="unesco-section" style="margin: 2rem 0; padding: 1.5rem; background: rgba(245, 158, 11, 0.05); border-radius: 12px;">
            <h4 style="color: #f59e0b; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>🏰</span> Contexte patrimonial
            </h4>
            ${Object.entries(contexteUnesco).map(([cle, valeur]) => `
                <div style="margin-bottom: 0.8rem;">
                    <strong style="color: #f59e0b; text-transform: capitalize;">
                        ${cle.replace('_', ' ')} :
                    </strong>
                    <span style="color: #92400e; margin-left: 0.5rem;">${valeur || ''}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function generateHistoricalFrequentationSection(frequentation) {
    if (!frequentation) return '';

    return `
        <div class="historical-frequentation-section" style="margin: 2rem 0; padding: 1.5rem; background: rgba(139, 92, 246, 0.05); border-radius: 12px;">
            <h4 style="color: #8b5cf6; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>👥</span> Fréquentation historique
            </h4>
            ${Object.entries(frequentation).map(([cle, valeur]) => `
                <div style="margin-bottom: 0.8rem;">
                    <strong style="color: #8b5cf6; text-transform: capitalize;">
                        ${cle.replace('_', ' ')} :
                    </strong>
                    <span style="color: #6b21a8; margin-left: 0.5rem;">${valeur}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function generateAssociatedHeritageSection(patrimoine) {
    if (!patrimoine) return '';

    return `
        <div class="heritage-section" style="margin: 2rem 0; padding: 1.5rem; background: rgba(220, 38, 38, 0.05); border-radius: 12px;">
            <h4 style="color: #dc2626; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>🏛️</span> Patrimoine associé
            </h4>
            ${Object.entries(patrimoine).map(([cle, valeur]) => `
                <div style="margin-bottom: 0.8rem;">
                    <strong style="color: #dc2626; text-transform: capitalize;">
                        ${cle.replace('_', ' ')} :
                    </strong>
                    <span style="color: #7f1d1d; margin-left: 0.5rem;">${valeur}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function generateNicknameSection(surnom, legende) {
    if (!surnom) return '';

    return `
        <div class="nickname-section" style="margin: 2rem 0; padding: 1.5rem; background: rgba(16, 185, 129, 0.05); border-radius: 12px; border-left: 4px solid #10b981;">
            <h4 style="color: #10b981; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>✨</span> Surnom traditionnel
            </h4>
            <p style="font-size: 1.1rem; font-weight: 600; color: #047857; margin-bottom: 1rem; font-style: italic;">
                "${surnom}"
            </p>
            ${legende ? `
                <p style="margin: 0; color: #065f46; line-height: 1.6;">
                    <strong>Légende :</strong> ${legende}
                </p>
            ` : ''}
        </div>
    `;
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        currentModal = null;

        // Réactiver le scroll du body
        document.body.style.overflow = '';

        // Nettoyer l'URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('source');
        history.pushState({}, '', newUrl.toString());
    }
}

/* ============================================
   6. PAGE SIGNALEMENT
   ============================================ */

function openSignalementPage(sourceId) {
    const source = sourcesData[sourceId];
    if (!source) return;

    console.log(`🚨 Ouverture page signalement: ${source.nom}`);

    try {
        // Générer le contenu de la page signalement
        const signalementContent = generateSignalementPageContent(source);

        // Afficher la modal signalement
        const overlay = document.getElementById('modal-overlay');
        const title = overlay.querySelector('.modal-title');
        const content = overlay.querySelector('.modal-body');

        title.textContent = `Signalement - ${source.nom}`;
        content.innerHTML = signalementContent;

        // Activer la modal
        overlay.classList.add('active');
        currentModal = `signalement-${sourceId}`;

        // Focus pour l'accessibilité
        const closeButton = overlay.querySelector('.modal-close');
        if (closeButton) closeButton.focus();

        // Désactiver le scroll du body
        document.body.style.overflow = 'hidden';

        console.log('✅ Page signalement ouverte');

    } catch (error) {
        console.error('❌ Erreur ouverture signalement:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}

function generateSignalementPageContent(source) {
    return `
        <div class="signalement-page">
            <!-- Section 1: Signalement Usagers (reste définitivement) -->
            <div class="signalement-section-public">
                <div class="section-header">
                    <h3>🚨 Signalement d'un problème</h3>
                    <p class="section-description">
                        Vous constatez un problème sur cette source ? Aidez-nous à maintenir une information de qualité.
                    </p>
                </div>

                <div class="signalement-types">
                    <h4>Type de problème à signaler :</h4>
                    <div class="problem-types-grid">
                        <div class="problem-type" onclick="selectProblemType('eau-douteuse', '${source.id}')">
                            <div class="problem-icon">💧</div>
                            <div class="problem-label">Qualité eau douteuse</div>
                            <div class="problem-desc">Couleur, odeur, goût anormal</div>
                        </div>
                        <div class="problem-type" onclick="selectProblemType('pollution', '${source.id}')">
                            <div class="problem-icon">🗑️</div>
                            <div class="problem-label">Pollution visible</div>
                            <div class="problem-desc">Déchets, pollution aux abords</div>
                        </div>
                        <div class="problem-type" onclick="selectProblemType('acces', '${source.id}')">
                            <div class="problem-icon">🚧</div>
                            <div class="problem-label">Problème d'accès</div>
                            <div class="problem-desc">Sécurité, signalétique</div>
                        </div>
                        <div class="problem-type" onclick="selectProblemType('frequentation', '${source.id}')">
                            <div class="problem-icon">👥</div>
                            <div class="problem-label">Usage massif</div>
                            <div class="problem-desc">Fréquentation très élevée</div>
                        </div>
                    </div>
                </div>

                <div class="signalement-contact">
                    <h4>📧 Contact</h4>
                    <p>Pour tout signalement urgent, contactez directement :</p>
                    <div class="contact-buttons">
                        <a href="mailto:contact@sources-vivantes.fr?subject=Signalement ${source.nom}" class="btn btn-secondary">
                            ✉️ Sources Vivantes
                        </a>
                        <a href="mailto:ars-nouvelle-aquitaine-contact@ars.sante.fr?subject=Signalement source ${source.nom}" class="btn btn-primary">
                            🏛️ ARS Nouvelle-Aquitaine
                        </a>
                    </div>
                </div>
            </div>

            <!-- Section 2: Démo Dashboard (disparaîtra après développement) -->
            <div class="signalement-section-demo">
                <div class="demo-banner">
                    <div class="demo-header">
                        <h3>🔮 Aperçu : Futur Dashboard Institutionnel</h3>
                        <span class="demo-badge">Fonctionnalité en développement</span>
                    </div>
                    <p class="demo-description">
                        Démonstration des capacités de pilotage et surveillance qui seraient disponibles 
                        pour les partenaires institutionnels (ARS, collectivités).
                    </p>
                </div>

                <div class="dashboard-demo-content">
                    <div class="demo-mockup">
                        <div class="demo-mockup-header">
                            <span class="demo-title">📊 Dashboard Temps Réel - ${source.nom}</span>
                        </div>
                        <div class="demo-mockup-stats">
                            <div class="demo-stat">
                                <span class="demo-stat-number">127</span>
                                <span class="demo-stat-label">Consultations ce mois</span>
                                <span class="demo-stat-trend">+34% vs mois dernier</span>
                            </div>
                            <div class="demo-stat">
                                <span class="demo-stat-number">23</span>
                                <span class="demo-stat-label">QR Codes scannés</span>
                                <span class="demo-stat-trend">Usage sur site</span>
                            </div>
                            <div class="demo-stat">
                                <span class="demo-stat-number">2</span>
                                <span class="demo-stat-label">Signalements reçus</span>
                                <span class="demo-stat-trend">Tous traités</span>
                            </div>
                        </div>
                        
                        <div class="demo-features-preview">
                            <h5>🎯 Fonctionnalités Disponibles</h5>
                            <div class="demo-feature-list">
                                <div class="demo-feature">✅ Monitoring consultations en temps réel</div>
                                <div class="demo-feature">✅ Détection automatique pics d'usage</div>
                                <div class="demo-feature">✅ Géolocalisation signalements</div>
                                <div class="demo-feature">✅ Historique complet par source</div>
                                <div class="demo-feature">✅ Export données pour études</div>
                                <div class="demo-feature">✅ Alertes email automatiques</div>
                            </div>
                        </div>

                        <div class="demo-value-proposition">
                            <h5>🚀 Bénéfices Institutionnels</h5>
                            <div class="value-props">
                                <div class="value-prop">
                                    <strong>📈 Pilotage Data-Driven</strong>
                                    <p>Prioriser les contrôles selon l'usage réel documenté</p>
                                </div>
                                <div class="value-prop">
                                    <strong>⚡ Réactivité Maximale</strong>
                                    <p>Signalements qualifiés avec géolocalisation précise</p>
                                </div>
                                <div class="value-prop">
                                    <strong>🎯 Communication Proactive</strong>
                                    <p>Maîtrise narrative face aux questionnements médiatiques</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="demo-contact">
                    <h4>💼 Présentation Institutionnelle</h4>
                    <p>Intéressé par ces fonctionnalités de pilotage ? Contactez-nous pour une démonstration personnalisée.</p>
                    <button onclick="contactForDemo()" class="btn btn-primary">
                        📞 Demander une démonstration
                    </button>
                </div>
            </div>
        </div>
    `;
}

function selectProblemType(type, sourceId) {
    const source = sourcesData[sourceId];
    const problemTypes = {
        'eau-douteuse': {
            subject: `URGENT - Qualité eau douteuse - ${source.nom}`,
            template: `Qualité de l'eau suspecte (couleur, odeur, goût anormal)`
        },
        'pollution': {
            subject: `Pollution constatée - ${source.nom}`, 
            template: `Pollution visible aux abords de la source`
        },
        'acces': {
            subject: `Problème d'accès - ${source.nom}`,
            template: `Difficultés d'accès ou problème de sécurité`
        },
        'frequentation': {
            subject: `Usage intensif - ${source.nom}`,
            template: `Fréquentation très élevée observée`
        }
    };

    const problem = problemTypes[type];
    if (!problem) return;

    const body = `Bonjour,

Je souhaite signaler un problème concernant la source : ${source.nom}

=== LOCALISATION ===
Source : ${source.nom}
Commune : ${source.commune}
Coordonnées GPS : ${source.coordonnees.lat}, ${source.coordonnees.lng}

=== PROBLÈME SIGNALÉ ===
Type : ${problem.template}
Date d'observation : [À compléter]
Description détaillée : [Décrivez précisément ce que vous avez observé]

=== VOS COORDONNÉES ===
Nom/Prénom : [Vos nom et prénom]
Email : [Votre email]
Téléphone : [Optionnel]

Cordialement,

---
Signalement via Sources Vivantes
https://sources-vivantes.fr/?source=${sourceId}`;

    // Notification puis ouverture email
    showNotification('Ouverture du formulaire de signalement...', 'info');
    
    setTimeout(() => {
        const mailtoLink = `mailto:contact@sources-vivantes.fr?cc=ars-nouvelle-aquitaine-contact@ars.sante.fr&subject=${encodeURIComponent(problem.subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    }, 1000);
}

function contactForDemo() {
    const subject = "Demande de démonstration - Dashboard Sources Vivantes";
    const body = `Bonjour,

Suite à la consultation de la page Sources Vivantes, je souhaite obtenir plus d'informations sur le dashboard institutionnel présenté.

Notre organisation : [À compléter]
Fonction : [À compléter]
Contexte : [Décrivez vos besoins/questionnements]

Nous serions intéressés par :
☐ Démonstration du dashboard
☐ Présentation des fonctionnalités
☐ Discussion sur un partenariat
☐ Informations techniques

Disponibilités : [À compléter]

Cordialement,

---
Contact via Sources Vivantes - Section Dashboard`;

    const mailtoLink = `mailto:contact@sources-vivantes.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
}

/* ============================================
   7. ACTIONS DES SOURCES
   ============================================ */

function shareSource(sourceId) {
    const source = sourcesData[sourceId];
    if (!source) return;

    const url = `${SOURCES_CONFIG.baseUrl}/?source=${sourceId}`;
    const message = `🌊 Découvrez les analyses de la ${source.nom} à ${source.commune} sur Sources Vivantes : ${url}`;

    if (navigator.share) {
        navigator.share({
            title: `${source.nom} - Sources Vivantes`,
            text: message,
            url: url
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(message).then(() => {
            showNotification('Lien copié dans le presse-papiers !', 'success');
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Lien copié !', 'success');
    }
}

function showOnMap(sourceId) {
    closeModal();

    const mapSection = document.getElementById('carte');
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth' });
    }

    setTimeout(() => {
        const source = sourcesData[sourceId];
        if (source && map) {
            map.setCenter(source.coordonnees);
            map.setZoom(15);

            const marker = markers.find(m => m.sourceId === sourceId);
            if (marker && marker.infoWindow) {
                marker.infoWindow.open(map, marker);
            }
        }
    }, 500);
}

function reportProblem(sourceId) {
    const source = sourcesData[sourceId];
    if (!source) return;

    const subject = `Signalement - ${source.nom} (${source.commune})`;
    const body = `Bonjour,

Je souhaite signaler un problème concernant la source suivante :

Source : ${source.nom}
Commune : ${source.commune}
Coordonnées : ${source.coordonnees.lat}, ${source.coordonnees.lng}

Nature du problème :
[Décrivez le problème observé : qualité de l'eau douteuse, accès difficile, pollution visible, etc.]

Date de l'observation :
[Indiquez quand vous avez observé le problème]

Informations complémentaires :
[Tout autre détail utile]

Cordialement`;

    const mailtoLink = `mailto:contact@sources-vivantes.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
}

/* ============================================
   8. GESTIONNAIRES D'ÉVÉNEMENTS
   ============================================ */

function handleModalClose(event) {
    if (event.target.id === 'modal-overlay' || event.target.classList.contains('modal-close')) {
        closeModal();
    }
}

function handleKeyDown(event) {
    if (event.key === 'Escape' && currentModal) {
        closeModal();
    }
}

function initMapFilters() {
    const filters = {
        'filter-conforme': 'conforme',
        'filter-non-conforme': 'non-conforme',
        'filter-attente': 'attente'
    };

    Object.entries(filters).forEach(([filterId, status]) => {
        const checkbox = document.getElementById(filterId);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                filterMarkers();
            });
        }
    });
}

function filterMarkers() {
    const showConforme = document.getElementById('filter-conforme')?.checked ?? true;
    const showNonConforme = document.getElementById('filter-non-conforme')?.checked ?? true;
    const showAttente = document.getElementById('filter-attente')?.checked ?? true;

    markers.forEach(marker => {
        const source = sourcesData[marker.sourceId];
        if (!source) return;

        const status = source.derniere_analyse?.statut || 'attente';
        let shouldShow = false;

        if (status === 'conforme' && showConforme) shouldShow = true;
        if (status === 'non-conforme' && showNonConforme) shouldShow = true;
        if (status === 'attente' && showAttente) shouldShow = true;

        marker.setVisible(shouldShow);
    });
}

function locateUser() {
    if (!navigator.geolocation) {
        showNotification('Géolocalisation non supportée par votre navigateur', 'error');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map.setCenter(userLocation);
            map.setZoom(12);

            new google.maps.Marker({
                position: userLocation,
                map: map,
                title: 'Votre position',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                }
            });

            showNotification('Position trouvée !', 'success');
        },
        (error) => {
            console.error('Erreur géolocalisation:', error);
            showNotification('Impossible de vous localiser', 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

/* ============================================
   9. UTILITAIRES
   ============================================ */

function formatDate(dateString) {
    if (!dateString || dateString === 'undefined' || dateString === 'null') {
        return 'Date non précisée';
    }
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Date invalide';
        }
        
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.warn('Erreur formatage date:', dateString, error);
        return 'Format de date invalide';
    }
}

function updateHeroStats() {
    const totalSources = Object.keys(sourcesData).length;
    const conformes = Object.values(sourcesData).filter(s => s.derniere_analyse?.statut === 'conforme').length;

    const totalElement = document.getElementById('total-sources');
    const conformesElement = document.getElementById('conformes');

    if (totalElement) totalElement.textContent = totalSources;
    if (conformesElement) conformesElement.textContent = conformes;
}

function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);

    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    // Fallback simple
    const container = document.getElementById('notification-container');
    if (container) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        container.appendChild(notification);
        
        setTimeout(() => notification.remove(), 4000);
    }
}

/* ============================================
   10. EXPORTS GLOBAUX
   ============================================ */

// Export toutes les fonctions nécessaires vers window
window.initModalSystem = initModalSystem;
window.openSource = openSource;
window.closeModal = closeModal;
window.initMap = initMap;
window.locateUser = locateUser;
window.shareSource = shareSource;
window.showOnMap = showOnMap;
window.reportProblem = reportProblem;
window.loadSourcesFromJSON = loadSourcesFromJSON;
window.openSignalementPage = openSignalementPage;
window.selectProblemType = selectProblemType;
window.contactForDemo = contactForDemo;

/* ============================================
   11. INITIALISATION AUTO
   ============================================ */

// Initialisation séquentielle pour éviter les problèmes de timing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('📄 DOM chargé, démarrage Sources Vivantes...');
        
        // 1. Charger les données JSON en premier
        await loadSourcesFromJSON();
        
        // 2. Initialiser le système de modals
        initModalSystem();
        
        console.log('✅ Sources Vivantes entièrement initialisé');
    });
} else {
    (async () => {
        console.log('📄 Script chargé après DOM, démarrage Sources Vivantes...');
        
        // 1. Charger les données JSON en premier
        await loadSourcesFromJSON();
        
        // 2. Initialiser le système de modals
        initModalSystem();
        
        console.log('✅ Sources Vivantes entièrement initialisé');
    })();
}

console.log('🌊 Sources Vivantes Modal System chargé et prêt');