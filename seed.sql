
INSERT OR REPLACE INTO settings(id,site_name,tagline,breaking_text,about_text,primary_color,accent_color)
VALUES(1,'Jornal Coopera Natal','Informação, serviços e cooperativismo em um só lugar.','Últimas informações sobre cooperativas, trabalho, serviços e oportunidades em Natal e Região Metropolitana.','O Jornal Coopera Natal é um portal independente de informação e utilidade voltado ao cooperativismo, trabalho, mobilidade, economia e serviços úteis.','#0a4f8a','#a61f2b');

INSERT INTO articles(title,summary,category,author,published_at,status,featured,content_type,body_html,source_name,source_url)
VALUES
('CLT ou cooperativa? Entenda as diferenças antes de decidir','Uma comparação prática entre vínculo, encargos, jornada, cobertura operacional e responsabilidades.','Especiais','Redação','2026-09-28','publicado',1,'materia','<p>Comparar salário com mensalidade não é suficiente. Uma decisão correta precisa considerar jornada, encargos, férias, afastamentos, substituições, estrutura operacional e a natureza jurídica de cada modelo.</p><p>No regime CLT, a empresa é empregadora e administra diretamente a relação de emprego. Em uma cooperativa legítima, a empresa contrata o serviço da cooperativa e não cada cooperado como empregado.</p><p>A relação cooperativa não pode ser usada para esconder subordinação típica de emprego. O funcionamento real do contrato é tão importante quanto o documento assinado.</p>','Lei nº 12.690/2012','https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12690.htm'),
('Lei nº 12.690/2012: guia das Cooperativas de Trabalho','Direitos, organização, assembleias e funcionamento das cooperativas de trabalho.','Legislação','Redação','2026-09-28','publicado',0,'materia','<p>A Lei nº 12.690/2012 disciplina a organização e o funcionamento das Cooperativas de Trabalho.</p>','Planalto','https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12690.htm'),
('INSS do cooperado: o que acompanhar','Entenda contribuição previdenciária, demonstrativos e consulta ao CNIS.','INSS e Previdência','Redação','2026-09-28','publicado',0,'materia','<p>O cooperado de cooperativa de trabalho é segurado contribuinte individual para fins previdenciários. É importante acompanhar os demonstrativos e conferir os registros no CNIS/Meu INSS.</p>','Meu INSS','https://meu.inss.gov.br/');

INSERT INTO links(name,category,description,url,active) VALUES
('Lei das Cooperativas de Trabalho — Lei 12.690/2012','Legislação','Texto oficial no Planalto.','https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12690.htm',1),
('Lei Geral do Cooperativismo — Lei 5.764/1971','Legislação','Texto oficial no Planalto.','https://www.planalto.gov.br/ccivil_03/leis/l5764.htm',1),
('Meu INSS','INSS e Previdência','Consulte CNIS, contribuições e serviços previdenciários.','https://meu.inss.gov.br/',1);

INSERT INTO faqs(question,answer) VALUES
('O que é uma cooperativa?','É uma sociedade de pessoas organizada para desenvolver atividade econômica ou prestar serviços em benefício comum dos cooperados, conforme a legislação aplicável.'),
('O Jornal Coopera Natal representa uma cooperativa específica?','Não. O portal foi estruturado para publicar informações, serviços, notícias e conteúdos de interesse do cooperativismo local.'),
('Onde encontro cursos, certidões e documentos?','Na área Links úteis, onde os serviços são cadastrados com nome, descrição e endereço para acesso.');

INSERT INTO ads(name,title,body,placement,target_url,active)
VALUES('Anuncie no Jornal','Divulgue sua marca no Jornal Coopera Natal','Cursos, empresas, cooperativas, serviços e eventos podem anunciar no portal.','middle','mailto:jornalcooperanatal@gmail.com',1);
