package fr.grozeille.db4all.entity.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntityLock {
    private String who;
    private String when;
    private String lockId;
}
