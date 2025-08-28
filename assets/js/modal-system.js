/* ============================================
   SOURCES VIVANTES - MODAL SYSTEM & MAPS
   Gestion des modals sources et carte interactive
   ============================================ */

/* ============================================
   1. VARIABLES GLOBALES
   ============================================ */

let map = null;
let markers = [];
let currentModal = null;
let sourcesData = {}; // Sera chargé depuis JSON

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
                    <!-- Contenu dynamique -->
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
        console.log('🔄 Chargement des données sources depuis JSON...');
        const response = await fetch('sources.json');
        
        if (response.ok) {
            const data = await response.json();
            sourcesData = data.sources || {};
            
            console.log('✅ Données sources chargées:', Object.keys(sourcesData).length, 'sources');
            console.log('📊 Sources:', Object.keys(sourcesData));
            
            // Mettre à jour l'affichage
            updateHeroStats();
            if (map) {
                addSourceMarkers();
            }
            
            return true;
        } else {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
    } catch (error) {
        console.warn('⚠️ Impossible de charger sources.json:', error.message);
        console.log('📁 Utilisation des données par défaut (mode démo)');
        
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
        
        updateHeroStats();
        return false;
    }
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
    
    // Adapter les champs selon la structure JSON réelle
    const caracteristiques = source.caracteristiques || {};
    const acces = caracteristiques.acces || {};
    
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
                    <p><strong>Fréquentation :</strong> ${caracteristiques.frequentation || 'Non renseignée'}</p>
                    <p><strong>Parking :</strong> ${acces.parking || 'Non renseigné'}</p>
                    <p><strong>Marche :</strong> ${acces.duree_marche || 'Non renseigné'}</p>
                </div>
            </div>

            ${analyse.parametres ? generateParametersSection(analyse.parametres) : ''}
            ${analyse.problemes ? generateProblemsSection(analyse.problemes) : ''}
            ${source.recommandations ? generateRecommendationsSection(source.recommandations) : ''}
            ${source.historique_analyses ? generateHistorySection(source.historique_analyses) : ''}

            <!-- Description -->
            <div class="source-description" style="margin: 2rem 0; padding: 1.5rem; background: rgba(8, 145, 178, 0.05); border-radius: 12px;">
                <h4 style="color: #0891b2; margin-bottom: 1rem;">💧 À propos de cette source</h4>
                <p>${source.description}</p>
            </div>

            <!-- Actions -->
            <div class="source-actions" style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; flex-wrap: wrap;">
                <button onclick="shareSource('${source.id}')" class="btn btn-secondary">
                    <span>🔤</span> Partager
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
   5. GOOGLE MAPS INTEGRATION
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
        markers.forEach(m => {
            if (m.infoWindow) m.infoWindow.close();
        });
        infoWindow.open(map, marker);
    });
    
    marker.infoWindow = infoWindow;
    
    return marker;
}

/* ============================================
   6. ACTIONS DES SOURCES
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
    
    const totalElement = document.getElementById('total-sources');
    const conformesElement = document.getElementById('conformes');
    
    if (totalElement) totalElement.textContent = totalSources;
    if (conformesElement) conformesElement.textContent = conformes;
}

function showNotification(message, type = 'info') {
    console.log(`🔢 ${type.toUpperCase()}: ${message}`);
    
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    }
}

/* ============================================
   9. EXPORTS GLOBAUX
   ============================================ */

window.initModalSystem = initModalSystem;
window.openSource = openSource;
window.closeModal = closeModal;
window.initMap = initMap;
window.locateUser = locateUser;
window.shareSource = shareSource;
window.showOnMap = showOnMap;
window.reportProblem = reportProblem;
window.loadSourcesFromJSON = loadSourcesFromJSON;

/* ============================================
   10. INITIALISATION AUTO
   ============================================ */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await loadSourcesFromJSON(); // CHARGER JSON EN PREMIER
        initModalSystem();
    });
} else {
    (async () => {
        await loadSourcesFromJSON(); // CHARGER JSON EN PREMIER
        initModalSystem();
    })();
}

console.log('🌊 Sources Vivantes Modal System chargé');