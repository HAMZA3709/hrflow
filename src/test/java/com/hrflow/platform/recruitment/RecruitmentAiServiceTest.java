package com.hrflow.platform.recruitment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;

import java.io.ByteArrayOutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RecruitmentAiServiceTest {
 @Test void extractsPdfAndParsesStructuredOllamaResponse()throws Exception{
  HttpServer server=HttpServer.create(new InetSocketAddress(0),0);
  server.createContext("/api/chat",exchange->{
   String body="{\"message\":{\"content\":\"{\\\"score\\\":82,\\\"recommendation\\\":\\\"STRONG_MATCH\\\",\\\"summary\\\":\\\"Profil pertinent\\\",\\\"strengths\\\":[\\\"Java 21\\\"],\\\"gaps\\\":[\\\"Anglais à vérifier\\\"],\\\"interviewQuestions\\\":[\\\"Décrivez une API récente.\\\"]}\"}}";
   byte[] bytes=body.getBytes(StandardCharsets.UTF_8);exchange.getResponseHeaders().add("Content-Type","application/json");exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);exchange.close();
  });
  server.start();
  try{
   CvStorageService cvs=mock(CvStorageService.class);when(cvs.download(7L)).thenReturn(new CvStorageService.Download(null,new ByteArrayResource(pdf("Expérience Java 21 et Spring Boot"))));
   var service=new RecruitmentAiService(cvs,new ObjectMapper(),new SimpleMeterRegistry(),"http://localhost:"+server.getAddress().getPort(),"qwen-test",Duration.ofSeconds(5),30000);
   var result=service.analyze(new RecruitmentService.AiContext(1L,7L,"Java Engineer","Construire HRFlow","Java 21",null));
   assertEquals(82,result.score());assertEquals("STRONG_MATCH",result.recommendation());assertEquals("Java 21",result.strengths().getFirst());assertTrue(result.disclaimer().contains("décision"));
  }finally{server.stop(0);}
 }

 private static byte[] pdf(String text)throws Exception{
  try(PDDocument document=new PDDocument();ByteArrayOutputStream output=new ByteArrayOutputStream()){
   PDPage page=new PDPage();document.addPage(page);
   try(PDPageContentStream stream=new PDPageContentStream(document,page)){stream.beginText();stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA),12);stream.newLineAtOffset(50,700);stream.showText(text);stream.endText();}
   document.save(output);return output.toByteArray();
  }
 }
}
