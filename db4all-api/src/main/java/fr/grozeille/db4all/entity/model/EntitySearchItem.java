package fr.grozeille.db4all.entity.model;

import lombok.Data;
import lombok.Getter;
import org.apache.solr.client.solrj.beans.Field;
import org.springframework.data.annotation.Id;
import org.springframework.data.solr.core.mapping.SolrDocument;

@Data
@SolrDocument
public class EntitySearchItem {

    @Id
    @Field
    private String id;

    @Getter
    @Field
    private String text;

    @Field
    private String projectId;

    @Field
    private String projectName;

    @Field
    private String name;

    @Field
    private String[] tags;

    @Field
    private String comment;
}
