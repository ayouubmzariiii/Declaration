export interface Demandeur {
  civilite: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
  qualite: string;
}

export interface Terrain {
  adresse: string;
  lieu_dit: string;
  code_postal: string;
  commune: string;
  section_cadastrale: string;
  numero_parcelle: string;
  superficie_terrain: number;
  zone_plu: string;
  est_lotissement: boolean;
  est_zone_protegee: boolean;
  est_monument_historique: boolean;
  dp1_mode: "classique" | "detaille";
}

export interface TravauxDetail {
  type_travaux: string;
  description_courte: string;
  surface_plancher_existante: number;
  surface_plancher_creee: number;
  emprise_au_sol_existante: number;
  emprise_au_sol_creee: number;
  hauteur_existante: number;
  hauteur_projetee: number;
  date_debut_prevue: string;
  duree_travaux_mois: number;
}

export interface AspectExterieur {
  facade_materiaux_existants: string;
  facade_materiaux_projetes: string;
  menuiseries_existantes: string;
  menuiseries_projetees: string;
  toiture_materiaux_existants: string;
  toiture_materiaux_projetes: string;
  cloture_existante: string;
  cloture_projetee: string;
  couleur_facade: string;
  couleur_menuiseries: string;
  couleur_volets: string;
  couleur_toiture: string;
  nombre_ouvertures_existantes: string;
  nombre_ouvertures_projetees: string;
}

export interface PhotoSet {
  label: string;
  chemin_avant: string;
  chemin_apres: string;
  description_avant: string;
  description_apres: string;
  base64_avant?: string | null;  // Used for React state before uploading to server
  base64_apres?: string | null;  // Used for React state before uploading to server
}

export interface PlansExterieurs {
  dp2_mode: "upload" | "ai";
  dp2_base64: string | null;
  dp3_mode: "upload" | "ai";
  dp3_base64: string | null;
  dp4_mode: "upload" | "ai";
  dp4_base64: string | null;
}

export interface NoticeDescriptive {
  etat_initial: string;
  etat_projete: string;
  justification: string;
  insertion_paysagere: string;
  impact_environnemental: string;
  modifications_detaillees: string;
  modification_volume: string;
  modification_emprise_au_sol: string;
  modification_surface_plancher: string;
  hauteur_estimee_existante: string;
  hauteur_estimee_projete: string;
  coherence_architecturale: string;
  risques_reglementaires_potentiels: string;
  niveau_confiance_global: string;
}

export interface PiecesJointes {
  [key: string]: {
    nom: string;
    fourni: boolean;
  };
}

export interface CerfaInfos {
  date_signature: string;
  lieu_signature: string;
  denomination_sociale?: string;
  siret?: string;
  nature_precisions?: string;
  co_demandeur?: {
    nom: string;
    prenom: string;
    adresse: string;
    code_postal: string;
    ville: string;
    telephone?: string;
    email?: string;
  };
  amenagements?: {
    piscine: boolean;
    garage: boolean;
    veranda: boolean;
    abri: boolean;
    extension: boolean;
    surelevation: boolean;
    cloture: boolean;
  };
  fiscalite?: {
    surface_taxable_existante: number;
    surface_taxable_creee: number;
    stationnement_cree: number;
  };
  architecte?: {
    recours: boolean;
    nom: string;
    numero: string;
  };
}

export interface DeclarationPrealable {
  reference: string;
  date_creation: string;
  demandeur: Demandeur;
  terrain: Terrain;
  travaux: TravauxDetail;
  aspect_exterieur: AspectExterieur;
  notice: NoticeDescriptive;
  photo_sets: PhotoSet[];
  plans: PlansExterieurs;
  pieces_jointes: PiecesJointes;
  cerfa: CerfaInfos;
}

export function getInitialDP(): DeclarationPrealable {
  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR');
  const refStr = `DP-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-001`;

  return {
    reference: refStr,
    date_creation: dateStr,
    demandeur: {
      civilite: "M.",
      nom: "Dupont",
      prenom: "Jean",
      date_naissance: "15/03/1985",
      lieu_naissance: "Paris",
      adresse: "12 Rue de la République",
      code_postal: "75001",
      ville: "Paris",
      telephone: "06 12 34 56 78",
      email: "jean.dupont@email.fr",
      qualite: "Propriétaire",
    },
    terrain: {
      adresse: "25 Chemin des Vignes",
      lieu_dit: "",
      code_postal: "19100",
      commune: "Brive-la-Gaillarde",
      section_cadastrale: "AB",
      numero_parcelle: "0123",
      superficie_terrain: 850.0,
      zone_plu: "UB",
      est_lotissement: false,
      est_zone_protegee: false,
      est_monument_historique: false,
      dp1_mode: "detaille",
    },
    travaux: {
      type_travaux: "Modification de l'aspect extérieur",
      description_courte: "Ravalement de façade avec remplacement des menuiseries",
      surface_plancher_existante: 95.0,
      surface_plancher_creee: 0.0,
      emprise_au_sol_existante: 110.0,
      emprise_au_sol_creee: 0.0,
      hauteur_existante: 5.5,
      hauteur_projetee: 5.5,
      date_debut_prevue: "01/04/2026",
      duree_travaux_mois: 3,
    },
    aspect_exterieur: {
      facade_materiaux_existants: "",
      facade_materiaux_projetes: "",
      menuiseries_existantes: "",
      menuiseries_projetees: "",
      toiture_materiaux_existants: "",
      toiture_materiaux_projetes: "",
      cloture_existante: "",
      cloture_projetee: "",
      couleur_facade: "",
      couleur_menuiseries: "",
      couleur_volets: "",
      couleur_toiture: "",
      nombre_ouvertures_existantes: "",
      nombre_ouvertures_projetees: "",
    },
    notice: {
      etat_initial: "",
      etat_projete: "",
      justification: "",
      insertion_paysagere: "",
      impact_environnemental: "",
      modifications_detaillees: "",
      modification_volume: "",
      modification_emprise_au_sol: "",
      modification_surface_plancher: "",
      hauteur_estimee_existante: "",
      hauteur_estimee_projete: "",
      coherence_architecturale: "",
      risques_reglementaires_potentiels: "",
      niveau_confiance_global: "",
    },
    photo_sets: [
      {
        label: "Façade Extérieure",
        chemin_avant: "",
        chemin_apres: "",
        description_avant: "",
        description_apres: "",
        base64_avant: "/images/avant 1.jpeg",
        base64_apres: "/images/apres 1.jpeg"
      },
      {
        label: "Façade Latérale",
        chemin_avant: "",
        chemin_apres: "",
        description_avant: "",
        description_apres: "",
        base64_avant: "/images/avant 2.jpeg",
        base64_apres: "/images/apres 2.jpeg"
      }
    ],
    plans: {
      dp2_mode: "ai",
      dp2_base64: "/plans/plan de mass.png",
      dp3_mode: "ai",
      dp3_base64: "/plans/plan de coupe.png",
      dp4_mode: "ai",
      dp4_base64: "/plans/plan des facades.png"
    },
    pieces_jointes: {
      "DP1": { nom: "Plan de situation", fourni: false },
      "DP2": { nom: "Plan de masse", fourni: false },
      "DP3": { nom: "Plan en coupe", fourni: false },
      "DP4": { nom: "Plan des façades et des toitures", fourni: false },
      "DP5": { nom: "Représentation de l'aspect extérieur", fourni: false },
      "DP6": { nom: "Document graphique d'insertion", fourni: false },
      "DP7": { nom: "Photographie environnement proche (état existant)", fourni: false },
      "DP8": { nom: "Photographie environnement lointain (état projeté)", fourni: false },
      "DP11": { nom: "Notice descriptive", fourni: true },
    },
    cerfa: {
      date_signature: new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('fr-FR'), // Tomorrow's date
      lieu_signature: "Paris",
      denomination_sociale: "SOCIETE DUPONT",
      siret: "12345678901234",
      nature_precisions: "Remplacement de menuiseries à l'identique",
      co_demandeur: {
        nom: "Martin",
        prenom: "Marie",
        adresse: "12 Rue de la République",
        code_postal: "75001",
        ville: "Paris"
      },
      amenagements: {
        piscine: false,
        garage: false,
        veranda: false,
        abri: false,
        extension: false,
        surelevation: false,
        cloture: true
      },
      fiscalite: {
        surface_taxable_existante: 95,
        surface_taxable_creee: 0,
        stationnement_cree: 0
      },
      architecte: {
        recours: false,
        nom: "",
        numero: ""
      }
    }
  };
}
