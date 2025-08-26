/* ============================================
   SOURCES VIVANTES - MODAL SYSTEM & MAPS
   Gestion des modals sources et carte interactive
   ============================================ */

/* ============================================
   1. DONNÉES DES SOURCES (Exemple)
   ============================================ */

const SOURCES_DATA = {
    "demo": {
        id: "demo",
        nom: "Source de Démonstration",
        commune: "Exemple-sur-Loire",
        departement: "Dordogne",
        coordonnees: {
            lat: 44.9759,
            lng: 1.0344
        },
        derniere_analyse: {
            date: "2025-06-15",
            statut: "conforme",
            laboratoire: "Eurofins Environnement",
            parametres: {
                nitrates: 8.2,
                nitrates_limite: 50,
                bacteries: 0,
                bacteries_limite: 0,
                ph: 7.4,
                ph_min: 6.5,
                ph_max: 9.0,
                conductivite: 420,
                turbidite: 0.8
            }
        },
        frequentation: "forte",
        acces: "Parking à 100m, sentier balisé facile (5 min de marche)",
        debit: "Constant toute l'année",
        description: "Source naturelle très appréciée des randonneurs. Eau claire et fraîche.",
        photos: ["demo-source-1.webp", "demo-source-2.webp"],
        historique_analyses: [
            {
                date: "2024-06-10",
                statut: "conforme",
                nitrates: 7.8,
                bacteries: 0
            }
        ]
    },
    
    "boulou_tursac": {
        id: "boulou_tursac",
        nom: "Source du Boulou",
        commune: "Tursac",
        departement: "Dordogne",
        coordonnees: {
            lat: 44.9759,
            lng: 1.0344
        },
        derniere_analyse: {
            date: "2025-05-20",
            statut: "conforme",
            laboratoire: "CARSO Laboratoires",
            parametres: {
                nitrates: 12.5,
                nitrates_limite: 50,
                bacteries: 0,
                bacteries_limite: 0,
                ph: 7.1,
                ph_min: 6.5,
                ph_max: 9.0,
                conductivite: 380,
                turbidite: 0.5
            }
        },
        frequentation: "très forte",
        acces: "Parking gratuit, accès direct (2 min à pied)",
        debit: "Abondant, stable",
        description: "Source historique très fréquentée, plusieurs dizaines de visiteurs par jour.",
        photos: ["boulou-1.webp", "boulou-2.webp"],
        historique_analyses: [
            {
                date: "2024-05-15",
                statut: "conforme",
                nitrates: 11.8,
                bacteries: 0
            }
        ]
    },
    
    "fontaine_saint_martial": {
        id: "fontaine_saint_martial",
        nom: "Fontaine Saint-Martial",
        commune: "Saint-Martial-de-Nabirat",
        departement: "Dordogne",
        coordonnees: {
            lat: 44.8234,
            lng: 1.2156
        },
        derniere_analyse: {
            date: "2025-07-02",
            statut: "non-conforme",
            laboratoire: "Eurofins Environnement",
            parametres: {
                nitrates: 62.0,
                nitrates_limite: 50,
                bacteries: 15,
                bacteries_limite: 0,
                ph: 6.8,
                ph_min: 6.5,
                ph_max: 9.0,
                conductivite: 580,
                turbidite: 2.1
            },
            problemes: [
                "Nitrates au-dessus de la limite (62 mg/L > 50 mg/L)",
                "Présence de bactéries coliformes (15 CFU/100mL)"
            ]
        },
        frequentation: "modérée",
        acces: "Sentier de randonnée, 15 min de marche depuis le village",
        debit: "Variable selon saison",
        description: "Source traditionnelle nécessitant une surveillance renforcée.",
        photos: ["saint-martial-1.webp"],
        historique_analyses: [
            {
                date: "2024-07-05",
                statut: "conforme",
                nitrates: 45.2,
                bacteries: 0
            }
        ],
        recommandations: [
            "Éviter la consommation directe",
            "Faire bouillir l'eau avant usage",
            "Nouvelle analyse prévue en septembre 2025"
        ]
    }
};

/* ============================================
   2. VARIABLES GLOBALES
   ============================================ */

let map = null;
let markers = [];
let currentModal = null;
let sourcesData = SOURCES_DATA;

/* ============================================
   3. INITIALISATION GÉNÉRALE
   ============================================ */

function initModalSystem() {
    console.log('🌊 Initialisation Sources Vivantes Modal System');
    
    // Créer le conteneur modal s'il n'existe pas
    if (!document.getElementById('modal-overlay')) {
        createModalContainer();
    }
    
    // Mettre à jour les stats dans le hero
    updateHeroStats();
    
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
                    <!-- Contenu dynamique -->
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/* ============================================
   4. GESTION DES MODALS SOURCES
   ============================================ */

function openSource(sourceId) {
    const source = sourcesData[sourceId];
    if (!source) {
        console.warn(`❌ Source "${sourceId}" non trouvée`);
        showNotification('Source non trouvée', 'error');
        return;
    }
    
    console.log(`🗂️ Ouverture source: ${source.nom}`);
    
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
}

function generateSourceModalContent(source) {
    const analyse = source.derniere_analyse;
    const statut = analyse.statut;
    
    // Icône et couleur selon le statut
    const statusConfig = {
        'conforme': { icon: '✅', color: '#10b981', label: 'Eau conforme' },
        'non-conforme': { icon: '❌', color: '#ef4444', label: 'Eau non conforme' },
        'attente': { icon: '🔄', color: '#f59e0b', label: 'Analyse en cours' }
    };
    
    const config = statusConfig[statut] || statusConfig['attente'];
    
    return `
        <div class="source-modal-content">
            <!-- Statut principal -->
            <div class="source-status" style="background: ${config.color}20; border-left: 4px solid ${config.color}; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-size: 2rem;">${config.icon}</span>
                    <div>
                        <h3 style="color: ${config.color}; margin: 0; font-size: 1.3rem;">${config.label}</h3>
                        <p style="margin: 0.5rem 0 0; color: #6b7280;">
                            Analyse du ${formatDate(analyse.date)} - ${analyse.laboratoire}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Informations générales -->
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
                    <p><strong>Fréquentation :</strong> ${source.frequentation}</p>
                    <p><strong>Accès :</strong> ${source.acces}</p>
                    <p><strong>Débit :</strong> ${source.debit}</p>
                </div>
            </div>

            <!-- Paramètres d'analyse -->
            <div class="analysis-section" style="margin-bottom: 2rem;">
                <h4 style="color: #0891b2; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>🧪</span> Paramètres d'analyse
                </h4>
                
                <div class="parameters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${generateParameterCard('Nitrates', analyse.parametres.nitrates, analyse.parametres.nitrates_limite, 'mg/L')}
                    ${generateParameterCard('Bactéries', analyse.parametres.bacteries, analyse.parametres.bacteries_limite, 'CFU/100mL')}
                    ${generateParameterCard('pH', analyse.parametres.ph, `${analyse.parametres.ph_min}-${analyse.parametres.ph_max}`, '')}
                    ${generateParameterCard('Conductivité', analyse.parametres.conductivite, null, 'µS/cm')}
                </div>
            </div>

            ${analyse.problemes ? generateProblemsSection(analyse.problemes) : ''}
            ${source.recommandations ? generateRecommendationsSection(source.recommandations) : ''}

            <!-- Historique -->
            ${generateHistorySection(source.historique_analyses)}

            <!-- Description -->
            <div class="source-description" style="margin: 2rem 0; padding: 1.5rem; background: rgba(8, 145, 178, 0.05); border-radius: 12px;">
                <h4 style="color: #0891b2; margin-bottom: 1rem;">💧 À propos de cette source</h4>
                <p>${source.description}</p>
            </div>

            <!-- Actions -->
            <div class="source-actions" style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; flex-wrap: wrap;">
                <button onclick="shareSource('${source.id}')" class="btn btn-secondary">
                    <span>📤</span> Partager
                </button>
                <button onclick="showOnMap('${source.id}')" class="btn btn-primary">
                    <span>🗺️</span> Voir sur la carte
                </button>
                <button onclick="reportProblem('${source.id}')" class="btn btn-secondary">
                    <span>⚠️</span> Signaler un problème
                </button>
            </div>

            <!-- Avertissement légal -->
            <div class="legal-notice" style="margin-top: 2rem; padding: 1rem; background: rgba(107, 114, 128, 0.1); border-radius: 8px; font-size: 0.9rem; color: #6b7280; text-align: center;">
                <strong>⚖️ Information uniquement</strong><br>
                Ces données sont fournies à titre informatif. Sources Vivantes ne délivre pas d'autorisation de consommation. 
                En cas de doute, consultez votre médecin ou les autorités sanitaires locales.
            </div>
        </div>
    `;
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

function generateProblemsSection(problems) {
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
   5. ACTIONS DES SOURCES
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
        // Fallback : sélectionner le texte
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
    
    // Scroller vers la carte
    const mapSection = document.getElementById('carte');
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Centrer la carte sur la source
    setTimeout(() => {
        const source = sourcesData[sourceId];
        if (source && map) {
            map.setCenter(source.coordonnees);
            map.setZoom(15);
            
            // Ouvrir l'info window du marqueur correspondant
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
   6. GOOGLE MAPS INTEGRATION
   ============================================ */

function initMap() {
    console.log('🗺️ Initialisation Google Maps');
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.log('❌ Élément carte non trouvé');
        return;
    }
    
    // Initialiser la carte
    map = new google.maps.Map(mapElement, {
        center: SOURCES_CONFIG.map.defaultCenter,
        zoom: SOURCES_CONFIG.map.defaultZoom,
        styles: getMapStyles(),
        gestureHandling: 'cooperative'
    });
    
    // Ajouter les marqueurs des sources
    addSourceMarkers();
    
    // Initialiser les filtres
    initMapFilters();
    
    console.log('✅ Google Maps initialisé');
}

function getMapStyles() {
    // Style de carte personnalisé (thème eau/nature)
    return [
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
                { "color": "#e9f4f7" }
            ]
        },
        {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [
                { "color": "#0891b2" }
            ]
        },
        {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [
                { "color": "#f5f9f5" }
            ]
        },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [
                { "color": "#ffffff" }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [
                { "color": "#e8f5e9" }
            ]
        }
    ];
}

function addSourceMarkers() {
    // Supprimer les marqueurs existants
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    Object.values(sourcesData).forEach(source => {
        const marker = createSourceMarker(source);
        markers.push(marker);
    });
}

function createSourceMarker(source) {
    const statusConfig = {
        'conforme': { color: '#10b981', icon: '✅' },
        'non-conforme': { color: '#ef4444', icon: '❌' },
        'attente': { color: '#f59e0b', icon: '🔄' }
    };
    
    const config = statusConfig[source.derniere_analyse.statut] || statusConfig['attente'];
    
    // Créer l'icône personnalisée
    const markerIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: config.color,
        fillOpacity: 0.8,
        strokeColor: '#ffffff',
        strokeWeight: 2
    };
    
    const marker = new google.maps.Marker({
        position: source.coordonnees,
        map: map,
        title: `${source.nom} - ${source.commune}`,
        icon: markerIcon,
        sourceId: source.id
    });
    
    // Créer l'info window
    const infoContent = `
        <div style="max-width: 300px; font-family: -apple-system, sans-serif;">
            <h3 style="margin: 0 0 0.5rem; color: #0891b2; font-size: 1.1rem;">${source.nom}</h3>
            <p style="margin: 0 0 0.5rem; color: #6b7280; font-size: 0.9rem;">${source.commune}, ${source.departement}</p>
            
            <div style="display: flex; align-items: center; gap: 0.5rem; margin: 0.8rem 0; padding: 0.5rem; background: ${config.color}20; border-radius: 6px;">
                <span style="font-size: 1.2rem;">${config.icon}</span>
                <span style="font-weight: 600; color: ${config.color};">
                    ${source.derniere_analyse.statut === 'conforme' ? 'Conforme' : 
                      source.derniere_analyse.statut === 'non-conforme' ? 'Non conforme' : 'En attente'}
                </span>
            </div>
            
            <p style="margin: 0.5rem 0; font-size: 0.85rem; color: #6b7280;">
                Analyse du ${formatDate(source.derniere_analyse.date)}
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
        // Fermer les autres info windows
        markers.forEach(m => {
            if (m.infoWindow) m.infoWindow.close();
        });
        
        infoWindow.open(map, marker);
    });
    
    marker.infoWindow = infoWindow;
    
    return marker;
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
        
        const status = source.derniere_analyse.statut;
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
            
            // Ajouter un marqueur pour l'utilisateur
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
   7. GESTIONNAIRES D'ÉVÉNEMENTS
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

/* ============================================
   8. UTILITAIRES
   ============================================ */

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function updateHeroStats() {
    const totalSources = Object.keys(sourcesData).length;
    const conformes = Object.values(sourcesData).filter(s => s.derniere_analyse.statut === 'conforme').length;
    
    // Mettre à jour les stats dans le hero
    const totalElement = document.getElementById('total-sources');
    const conformesElement = document.getElementById('conformes');
    
    if (totalElement) totalElement.textContent = totalSources;
    if (conformesElement) conformesElement.textContent = conformes;
}

function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Cette fonction sera utilisée par les autres scripts
    // Utilise le système de notification déjà défini dans index.html
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    }
}

/* ============================================
   9. CHARGEMENT DE DONNÉES EXTERNES (OPTIONNEL)
   ============================================ */

async function loadSourcesFromJSON() {
    try {
        const response = await fetch('documents/data/sources.json');
        if (response.ok) {
            const data = await response.json();
            sourcesData = { ...sourcesData, ...data.sources };
            
            // Mettre à jour l'affichage
            updateHeroStats();
            if (map) {
                addSourceMarkers();
            }
            
            console.log('✅ Données sources chargées depuis JSON');
        }
    } catch (error) {
        console.warn('⚠️ Impossible de charger sources.json, utilisation des données par défaut');
    }
}

/* ============================================
   10. EXPORTS GLOBAUX
   ============================================ */

// Exporter les fonctions vers window pour usage global
window.initModalSystem = initModalSystem;
window.openSource = openSource;
window.closeModal = closeModal;
window.initMap = initMap;
window.locateUser = locateUser;
window.shareSource = shareSource;
window.showOnMap = showOnMap;
window.reportProblem = reportProblem;

/* ============================================
   11. INITIALISATION AUTO
   ============================================ */

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initModalSystem();
        loadSourcesFromJSON();
    });
} else {
    initModalSystem();
    loadSourcesFromJSON();
}

console.log('🌊 Sources Vivantes Modal System chargé');