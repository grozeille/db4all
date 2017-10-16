package fr.grozeille.db4all.configurations;

import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.solr.repository.SolrCrudRepository;

import java.beans.BeanInfo;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.io.InvalidClassException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
public abstract class HBaseWithSolrJsonDataRepository<T, I> extends HBaseJsonDataRepository<T> implements PagingAndSortingRepository<T, String> {

    protected final SolrCrudRepository<I, String> solrRepository;

    private Field idSearchField;

    private PropertyDescriptor idSearchProp;

    protected final Class searchItemClass;

    public HBaseWithSolrJsonDataRepository(Class entityClass, String tableName, String[] additionalColumnFamilies, SolrCrudRepository<I, String> solrRepository, Class searchItemClass) throws IntrospectionException, InvalidClassException {
        super(entityClass, tableName, additionalColumnFamilies);
        this.solrRepository = solrRepository;
        this.searchItemClass = searchItemClass;

        BeanInfo info = Introspector.getBeanInfo(searchItemClass);


        Field[] fields = searchItemClass.getDeclaredFields();
        for(Field field : fields){
            if(field.getAnnotation(Id.class) != null){
                if(!field.getType().equals(String.class)){
                    throw new InvalidClassException("The @Id must be of String type");
                }
                idSearchField = field;
                idSearchField.setAccessible(true);
                break;
            }
        }
        PropertyDescriptor[] props = info.getPropertyDescriptors(); //Gets all the properties for the class.
        for(PropertyDescriptor prop : props){
            if(prop.getReadMethod().getAnnotation(Id.class) != null){
                if(!prop.getPropertyType().equals(String.class)){
                    throw new InvalidClassException("The @Id must be of String type");
                }
                idSearchProp = prop;
                break;
            }
        }

        if(idSearchField == null && idSearchProp == null){
            throw new InvalidClassException("The class must have @Id");
        }
    }

    protected abstract I toSearchItem(T item);

    @Override
    public Iterable<T> findAll(Sort sort) {
        Iterable<I> searchItems = solrRepository.findAll(sort);
        List<String> ids = new ArrayList<>();
        try {
            for(I i : searchItems){
                ids.add(getSearchItemId(i));
            }
        } catch (IllegalAccessException e) {
            log.error("Unable to get Id", e);
        } catch (InvocationTargetException e) {
            log.error("Unable to get Id", e);
        }

        return this.findAll(ids);
    }

    @Override
    public Page<T> findAll(Pageable pageable) {
        Page<I> searchItems = solrRepository.findAll(pageable);
        List<String> ids = new ArrayList<>();
        try {
            for(I i : searchItems){
                ids.add(getSearchItemId(i));
            }
        } catch (IllegalAccessException e) {
            log.error("Unable to get Id", e);
        } catch (InvocationTargetException e) {
            log.error("Unable to get Id", e);
        }

        Iterable<T> all = this.findAll(ids);
        return new PageImpl<>(Lists.newArrayList(all.iterator()), pageable, searchItems.getTotalElements());
    }

    @Override
    public <S extends T> S save(S entity) {
        S result = super.save(entity);
        this.solrRepository.save(toSearchItem(result));
        return result;
    }

    @Override
    public <S extends T> Iterable<S> save(Iterable<S> entities) {
        Iterable<S> result = super.save(entities);
        List<I> searchItem = new ArrayList<>();
        for(S r : result){
            searchItem.add(toSearchItem(r));
        }
        this.solrRepository.save(searchItem);
        return result;
    }

    @Override
    public void delete(String id) {
        super.delete(id);
        this.solrRepository.delete(id);
    }

    @Override
    public void delete(Iterable<? extends T> entities) {
        super.delete(entities);
        for(T e : entities){
            try {
                String id = getId(e);
                this.solrRepository.delete(id);
            } catch (IllegalAccessException | InvocationTargetException e1) {
                log.error("Unable to get Id", e1);
            }

        }
    }

    @Override
    public void deleteAll() {
        super.deleteAll();
        this.solrRepository.deleteAll();
    }

    protected String getSearchItemId(I object) throws IllegalAccessException, InvocationTargetException {
        if(idSearchField != null){
            return (String)idSearchField.get(object);
        }
        //else if(idProp != null){
        return (String)idSearchProp.getReadMethod().invoke(object);
        //}
    }


    protected void setSearchItemId(I object, String id) throws InvocationTargetException, IllegalAccessException {
        if(idSearchField != null){
            idSearchField.set(object, id);
        }
        else if(idSearchProp != null){
            idSearchProp.getWriteMethod().invoke(object, id);
        }
    }
}
