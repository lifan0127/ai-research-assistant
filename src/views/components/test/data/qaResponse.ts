export const qaResponseAction: any = {
  action: 'qa',
  payload: {
    widget: 'QA_RESPONSE' as const,
    input: {
      answer:
        'Machine learning can be used for materials discovery through the digitization of chemistry. This involves creating a hard link between an abstracted process ontology of chemistry and bespoke hardware for performing reactions or exploring reactivity. A chemical state machine is developed that uses this ontology to connect precise instruction sets to hardware that performs chemical transformations. This approach enables a universal standard for describing chemistry procedures via a chemical programming language. The digitization of chemistry can reduce the labor needed to make new compounds and broaden accessible chemical space. Automation in chemistry has developed workflows for automating chemical synthesis as well as materials, nanomaterials, and formulation production. A key aspect is the use of a batch system that can encode the chemical reagents, solvent, and products as packets which can be moved around the system. The integration of sensor systems for monitoring and controlling the state of the chemical synthesis machine, as well as high resolution spectroscopic tools, is vital for facilitating closed-loop autonomous experiments. Systems that not only make molecules and materials, but also optimize their function, and use algorithms to assist with the development of new synthetic pathways and process optimization are also possible. Digital-chemical robot systems need to integrate feedback from simple sensors, such as conductivity or temperature, as well as online analytics in order to navigate process space autonomously. This opens the door to accessing known molecules (synthesis), exploring whether known compounds/reactions are possible under new conditions (optimization), and searching chemical space for unknown and unexpected new molecules, reactions, and modes of reactivity (discovery).',
      sources: [
        {
          item: {
            id: 242,
            type: 'journalArticle' as const,
          },
          attachment: {
            id: 244,
            type: 'attachment-pdf-link' as const,
          },
          bib: '(1) Wilbraham, L.; Mehr, S. H. M.; Cronin, L. Digitizing Chemistry Using the Chemical Processing Unit: From Synthesis to Discovery. Acc. Chem. Res. 2021, 54 (2), 253–262. https://doi.org/10.1021/acs.accounts.0c00674.\n',
        },
        {
          item: {
            id: 335,
            type: 'journalArticle' as const,
          },
          bib: '(2) Hammer, A. J. S.; Leonov, A. I.; Bell, N. L.; Cronin, L. Chemputation and the Standardization of Chemical Informatics. JACS Au 2021, 1 (10), 1572–1587. https://doi.org/10.1021/jacsau.1c00303.\n',
        },
      ],
    },
  },
}
