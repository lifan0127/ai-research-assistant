import React from 'react'
import { searchZotero } from '../../../models/chains/search'
import { Message } from '../../hooks/useMessages'

const results: any = [
  {
    title: 'Digitizing Chemistry Using the Chemical Processing Unit: From Synthesis to Discovery',
    authors: 'Wilbraham et al.',
    itemType: 'journalArticle',
    year: 2021,
  },
  {
    title: 'Chemputation and the Standardization of Chemical Informatics',
    authors: 'Hammer et al.',
    itemType: 'journalArticle',
    year: 2021,
  },
  {
    title: 'End-user engineering of ontology-based knowledge bases',
    authors: 'Sanctorum et al.',
    itemType: 'journalArticle',
    year: 2022,
  },
  {
    title: 'End-user engineering of ontology-based knowledge bases',
    authors: 'Sanctorum et al.',
    itemType: 'journalArticle',
    year: 2022,
  },
  {
    title: 'A Concept Knowledge Graph for User Next Intent Prediction at Alipay',
    authors: 'He et al.',
    itemType: 'preprint',
    year: 2022,
  },
  {
    title:
      'The Devices, Experimental Scaffolds, and Biomaterials Ontology (DEB): A Tool for Mapping, Annotation, and Analysis of Biomaterials’ Data',
    authors: 'Hakimi et al.',
    itemType: 'journalArticle',
    year: 2020,
  },
  {
    title: 'Knowledge Graph Embeddings for ICU readmission prediction',
    authors: 'Carvalho et al.',
    itemType: 'journalArticle',
    year: 2022,
  },
  {
    title: 'The Treasury Chest of Text Mining: Piling Available Resources for Powerful Biomedical Text Mining',
    authors: 'Rosário-Ferreira et al.',
    itemType: 'journalArticle',
    year: null,
  },
  {
    title: 'Auto-CORPus: A Natural Language Processing Tool for Standardizing and Reusing Biomedical Literature',
    authors: 'Beck et al.',
    itemType: 'journalArticle',
    year: 2021,
  },
  {
    title: 'The Biomaterials Annotator: a system for ontology-based concept annotation of biomaterials text',
    authors: 'Corvi et al.',
    itemType: 'conferencePaper',
    year: 2021,
  },
  {
    title: 'Self-learning entropic population annealing for interpretable materials design',
    authors: 'Li et al.',
    itemType: 'journalArticle',
    year: 2022,
  },
  {
    title:
      'Random projections and kernelised leave one cluster out cross validation: universal baselines and evaluation tools for supervised machine learning of material properties',
    authors: 'Durdy et al.',
    itemType: 'journalArticle',
    year: 2022,
  },
  {
    title: 'Predicting compositional changes of organic–inorganic hybrid materials with Augmented CycleGAN',
    authors: 'Ai et al.',
    itemType: 'journalArticle',
    year: 2022,
  },
  {
    title: 'Sparse modeling for small data: case studies in controlled synthesis of 2D materials',
    authors: 'Haraguchi et al.',
    itemType: 'journalArticle',
    year: 2022,
  },
  {
    title: 'Quantifying the performance of machine learning models in materials discovery',
    authors: 'Borg et al.',
    itemType: 'journalArticle',
    year: 2023,
  },
  {
    title:
      'Materials synthesizability and stability prediction using a semi-supervised teacher-student dual neural network',
    authors: 'Gleaves et al.',
    itemType: 'journalArticle',
    year: 2023,
  },
  {
    title: 'Krein support vector machine classification of antimicrobial peptides',
    authors: 'Redshaw et al.',
    itemType: 'journalArticle',
    year: 2023,
  },
  {
    title: 'Krein support vector machine classification of antimicrobial peptides',
    authors: 'Redshaw et al.',
    itemType: 'journalArticle',
    year: 2023,
  },
  {
    title: 'Combining Machine Learning and Semantic Web: A Systematic Mapping Study',
    authors: 'Breit et al.',
    itemType: 'journalArticle',
    year: 2023,
  },
  {
    title: 'Classical and quantum machine learning applications in spintronics',
    authors: 'Ghosh et al.',
    itemType: 'journalArticle',
    year: 2022,
  },
  {
    title: 'Emergent autonomous scientific research capabilities of large language models',
    authors: 'Boiko et al.',
    itemType: 'preprint',
    year: 2023,
  },
  {
    title: 'Toward Representing Research Contributions in Scholarly Knowledge Graphs Using Knowledge Graph Cells',
    authors: 'Vogt et al.',
    itemType: 'conferencePaper',
    year: 2020,
  },
  {
    title:
      '14 Examples of How LLMs Can Transform Materials Science and Chemistry: A Reflection on a Large Language Model Hackathon',
    authors: 'Jablonka et al.',
    itemType: 'preprint',
    year: 2023,
  },
  {
    title: 'ChemCrow: Augmenting large-language models with chemistry tools',
    authors: 'Bran et al.',
    itemType: 'preprint',
    year: 2023,
  },
]

const testMessages = [
  {
    label: 'User hello',
    message: { type: 'USER_MESSAGE' as const, content: 'Hello!' },
  },
  {
    label: 'Search ML',
    message: { type: 'USER_MESSAGE' as const, content: 'Find some papers on machine learning.' },
  },
  {
    label: 'Unclear Search',
    message: { type: 'USER_MESSAGE' as const, content: 'Can you help me search for papers?' },
  },
  {
    label: 'QA ML',
    message: { type: 'USER_MESSAGE' as const, content: 'How to use machine learning for materials discovery?' },
  },
  {
    label: 'QA Unknown',
    message: { type: 'USER_MESSAGE' as const, content: 'How to use knowledge graphs in chemistry?' },
  },
  {
    label: 'Summarize',
    message: { type: 'USER_MESSAGE' as const, content: 'Summarize the search results.' },
  },
  // {
  //   label: 'Bot lengthy',
  //   message: {
  //     type: 'BOT_MESSAGE' as const,
  //     widget: 'MARKDOWN' as const,
  //     input: {
  //       content:
  //         'This is a new bot message.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.\n\nThis is another line.',
  //     },
  //   },
  // },
  // {
  //   label: 'Bot search output',
  //   message: {
  //     type: 'BOT_MESSAGE' as const,
  //     widget: 'SEARCH_RESULTS' as const,
  //     input: {
  //       query: {
  //         keywords: ['machine learning', 'deep learning', 'artificial intelligence', 'neural networks'],
  //         authors: [],
  //         tags: [],
  //         years: {
  //           from: 2021,
  //           to: 2023,
  //         },
  //       },
  //       count: 120,
  //       results: results.slice(0, 25),
  //     },
  //   },
  // },
  {
    label: 'Bot QA output',
    message: {
      type: 'BOT_MESSAGE' as const,
      widget: 'QA_RESPONSE' as const,
      input: {
        answer:
          'Machine learning can be used for materials discovery through the digitization of chemistry. This involves creating a hard link between an abstracted process ontology of chemistry and bespoke hardware for performing reactions or exploring reactivity. A chemical state machine is developed that uses this ontology to connect precise instruction sets to hardware that performs chemical transformations. This approach enables a universal standard for describing chemistry procedures via a chemical programming language. The digitization of chemistry can reduce the labor needed to make new compounds and broaden accessible chemical space. Automation in chemistry has developed workflows for automating chemical synthesis as well as materials, nanomaterials, and formulation production. A key aspect is the use of a batch system that can encode the chemical reagents, solvent, and products as packets which can be moved around the system. The integration of sensor systems for monitoring and controlling the state of the chemical synthesis machine, as well as high resolution spectroscopic tools, is vital for facilitating closed-loop autonomous experiments. Systems that not only make molecules and materials, but also optimize their function, and use algorithms to assist with the development of new synthetic pathways and process optimization are also possible. Digital-chemical robot systems need to integrate feedback from simple sensors, such as conductivity or temperature, as well as online analytics in order to navigate process space autonomously. This opens the door to accessing known molecules (synthesis), exploring whether known compounds/reactions are possible under new conditions (optimization), and searching chemical space for unknown and unexpected new molecules, reactions, and modes of reactivity (discovery).',
        sources: [
          {
            itemId: 242,
            bib: '(1) Wilbraham, L.; Mehr, S. H. M.; Cronin, L. Digitizing Chemistry Using the Chemical Processing Unit: From Synthesis to Discovery. Acc. Chem. Res. 2021, 54 (2), 253–262. https://doi.org/10.1021/acs.accounts.0c00674.\n',
          },
          {
            itemId: 335,
            bib: '(2) Hammer, A. J. S.; Leonov, A. I.; Bell, N. L.; Cronin, L. Chemputation and the Standardization of Chemical Informatics. JACS Au 2021, 1 (10), 1572–1587. https://doi.org/10.1021/jacsau.1c00303.\n',
          },
        ],
      },
    },
  },
]

interface TestButtonsProps {
  setUserInput: (input: { content: string }) => void
  addMessage: (message: Partial<Message>) => void
  onClick?: () => void
}

export function TestButtons({ setUserInput, addMessage, onClick }: TestButtonsProps) {
  async function handleSearch() {
    console.log(
      await searchZotero(
        { keywords: [''], authors: ['Oliveira'], tags: [], years: { from: 1900, to: 2023 } },
        { handleZoteroActionStart: () => {}, handleZoteroActionEnd: () => {} },
        'search'
      )
    )
  }

  return (
    <div className="fixed top-2 right-16 z-10">
      {testMessages.map(({ label, message }, i) => (
        <button
          key={`test-message-${i}`}
          className="p-0 text-xs"
          onClick={() => {
            addMessage(message)
            if (message.type === 'USER_MESSAGE') {
              setUserInput({ content: message.content })
            }
          }}
        >
          {label}
        </button>
      ))}
      <button className="p-0 text-xs" onClick={handleSearch}>
        Search
      </button>
      <button className="p-0 text-xs" onClick={onClick}>
        Click
      </button>
    </div>
  )
}
